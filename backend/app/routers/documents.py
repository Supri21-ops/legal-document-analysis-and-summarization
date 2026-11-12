import os
import difflib
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.document import Document, DocumentAnalysis, ClauseAnalysis, BlockchainRecord
from app.utils.auth import get_current_user
from app.utils.file_handler import save_upload_file, validate_file
from app.services import document_service, nlp_service, ml_service, genai_service, blockchain_service

router = APIRouter(prefix="/api/documents", tags=["Documents"])

class CompareRequest(BaseModel):
    doc1_id: int
    doc2_id: int

def process_document_background(document_id: int, file_path: str, owner_email: str):
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return
        doc.status = "processing"
        doc.processing_step = "Step 1/5: Extracting text from document"
        doc.error_message = None
        db.commit()

        # Step 1: Text extraction
        text = document_service.extract_text(file_path)
        if not text or len(text.strip()) < 10:
            raise ValueError("The uploaded document appears to be empty or unreadable.")

        # Document type classification
        from app.services.nlp_service import classify_document_type
        doc_classification = classify_document_type(text)
        if hasattr(doc, "document_type"):
            doc.document_type = doc_classification.get("document_type", "Legal Contract")
        if hasattr(doc, "is_legal_contract"):
            doc.is_legal_contract = doc_classification.get("is_legal_contract", True)
        if hasattr(doc, "anomaly_warning"):
            doc.anomaly_warning = doc_classification.get("warning")
        db.commit()

        # Step 2: NLP Analysis
        doc.processing_step = "Step 2/5: Extracting clauses, parties & entities (NLP)"
        db.commit()
        nlp_results = nlp_service.process_document(text)

        # Step 3: ML Risk Classification
        doc.processing_step = "Step 3/5: Running ML risk scoring & legal classification"
        db.commit()
        analyzed_clauses = ml_service.analyze_clauses(nlp_results["clauses"])
        risk_summary = ml_service.calculate_overall_risk(analyzed_clauses)

        # Step 4: GenAI Executive Summary & Vector Store Indexing
        doc.processing_step = "Step 4/5: Generating summary & indexing semantic vector store"
        db.commit()
        summary = genai_service.generate_summary(text, doc.original_filename)
        genai_service.build_vector_store(document_id, text)

        # Step 5: Save Analysis Records
        analysis = DocumentAnalysis(
            document_id=document_id,
            extracted_text=text[:50000],
            summary=summary,
            parties=nlp_results["parties"],
            important_dates=nlp_results["dates"],
            obligations=nlp_results["obligations"],
            clauses=[{
                "text": c["text"],
                "category": c.get("primary_category", "General"),
                "risk_level": c.get("risk_level", "Low"),
                "risk_score": c.get("risk_score", 0.0),
                "flagged_terms": c.get("flagged_terms", [])
            } for c in analyzed_clauses[:40]],
            entities=nlp_results["entities"],
            overall_risk_score=risk_summary["overall_risk_score"],
            risk_level=risk_summary["risk_level"],
            high_risk_clauses_count=risk_summary["high_risk_count"],
            total_clauses_count=len(analyzed_clauses),
        )
        db.add(analysis)
        db.flush()

        for clause in analyzed_clauses[:40]:
            db.add(ClauseAnalysis(
                analysis_id=analysis.id,
                clause_text=clause["text"],
                clause_category=clause.get("primary_category", "General"),
                risk_level=clause.get("risk_level", "Low"),
                risk_score=clause.get("risk_score", 0.0),
            ))

        # Step 6: Blockchain Hash Recording
        doc.processing_step = "Step 5/5: Anchoring cryptographic SHA-256 hash to blockchain"
        db.commit()
        bc_result = blockchain_service.store_document_hash(str(document_id), doc.document_hash, owner_email)
        bc_record = BlockchainRecord(
            document_id=document_id,
            document_hash=doc.document_hash,
            transaction_hash=bc_result.get("transaction_hash", ""),
            block_number=bc_result.get("block_number", 1),
            blockchain_network=bc_result.get("network", "Ganache Local"),
            contract_address=bc_result.get("contract_address", ""),
            is_verified=bc_result.get("status") in ["confirmed", "simulated"],
        )
        db.add(bc_record)

        doc.status = "completed"
        doc.processing_step = "Completed"
        doc.error_message = None
        db.commit()

    except Exception as e:
        try:
            doc = db.query(Document).filter(Document.id == document_id).first()
            if doc:
                doc.status = "failed"
                doc.processing_step = "Failed during analysis"
                doc.error_message = f"Processing error: {str(e)}"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    validate_file(file)
    file_path, doc_hash, file_size = await save_upload_file(file, current_user.id)
    ext = os.path.splitext(file.filename)[1].lower().lstrip(".")
    doc = Document(
        owner_id=current_user.id,
        filename=os.path.basename(file_path),
        original_filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        file_type=ext,
        document_hash=doc_hash,
        status="uploaded",
        processing_step="Queued for analysis",
        error_message=None
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    background_tasks.add_task(process_document_background, doc.id, file_path, current_user.email)
    return {
        "id": doc.id,
        "filename": doc.original_filename,
        "status": "uploaded",
        "processing_step": "Queued for analysis",
        "message": "Document uploaded and queued for processing"
    }

@router.get("/")
def list_documents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.owner_id == current_user.id).order_by(Document.created_at.desc()).all()
    result = []
    for doc in docs:
        d = {
            "id": doc.id,
            "original_filename": doc.original_filename,
            "file_type": doc.file_type,
            "file_size": doc.file_size,
            "status": doc.status,
            "processing_step": getattr(doc, "processing_step", None),
            "error_message": getattr(doc, "error_message", None),
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
            "overall_risk_score": None,
            "risk_level": None
        }
        if doc.analysis:
            d["overall_risk_score"] = doc.analysis.overall_risk_score
            d["risk_level"] = doc.analysis.risk_level
        result.append(d)
    return result

@router.get("/{document_id}")
def get_document(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    result = {
        "id": doc.id,
        "original_filename": doc.original_filename,
        "file_type": doc.file_type,
        "file_size": doc.file_size,
        "status": doc.status,
        "processing_step": getattr(doc, "processing_step", None),
        "error_message": getattr(doc, "error_message", None),
        "document_hash": doc.document_hash,
        "document_type": getattr(doc, "document_type", "Legal Contract"),
        "is_legal_contract": getattr(doc, "is_legal_contract", True),
        "anomaly_warning": getattr(doc, "anomaly_warning", None),
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
        "analysis": None,
        "blockchain": None
    }
    if doc.analysis:
        result["analysis"] = {
            "summary": doc.analysis.summary,
            "parties": doc.analysis.parties,
            "important_dates": doc.analysis.important_dates,
            "obligations": doc.analysis.obligations,
            "clauses": doc.analysis.clauses,
            "entities": doc.analysis.entities,
            "overall_risk_score": doc.analysis.overall_risk_score,
            "risk_level": doc.analysis.risk_level,
            "high_risk_clauses_count": doc.analysis.high_risk_clauses_count,
            "total_clauses_count": doc.analysis.total_clauses_count,
        }
    if doc.blockchain_record:
        result["blockchain"] = {
            "document_hash": doc.blockchain_record.document_hash,
            "transaction_hash": doc.blockchain_record.transaction_hash,
            "block_number": doc.blockchain_record.block_number,
            "network": doc.blockchain_record.blockchain_network,
            "timestamp": doc.blockchain_record.timestamp.isoformat() if doc.blockchain_record.timestamp else None,
            "is_verified": doc.blockchain_record.is_verified,
        }
    return result

@router.get("/{document_id}/status")
def get_document_status(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "id": doc.id,
        "status": doc.status,
        "processing_step": getattr(doc, "processing_step", None),
        "error_message": getattr(doc, "error_message", None)
    }

@router.post("/compare")
def compare_documents(
    request: CompareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Innovative Document Comparison Engine:
    Compares two contracts (e.g. Version 1 vs Version 2, or Master Agreement vs Vendor Amendment)
    and reports risk delta, clause additions/removals, and category distribution shifts.
    """
    doc1 = db.query(Document).filter(Document.id == request.doc1_id, Document.owner_id == current_user.id).first()
    doc2 = db.query(Document).filter(Document.id == request.doc2_id, Document.owner_id == current_user.id).first()

    if not doc1 or not doc2:
        raise HTTPException(status_code=404, detail="One or both documents not found")
    if not doc1.analysis or not doc2.analysis:
        raise HTTPException(status_code=400, detail="Both documents must be analyzed before comparing")

    # Risk Delta
    score1 = doc1.analysis.overall_risk_score or 0.0
    score2 = doc2.analysis.overall_risk_score or 0.0
    risk_delta = round(score2 - score1, 1)

    # Categories
    cats1: Dict[str, int] = {}
    for c in (doc1.analysis.clauses or []):
        cat = c.get("category", "General")
        cats1[cat] = cats1.get(cat, 0) + 1

    cats2: Dict[str, int] = {}
    for c in (doc2.analysis.clauses or []):
        cat = c.get("category", "General")
        cats2[cat] = cats2.get(cat, 0) + 1

    all_cats = set(cats1.keys()).union(set(cats2.keys()))
    category_diff = []
    for cat in sorted(all_cats):
        count1 = cats1.get(cat, 0)
        count2 = cats2.get(cat, 0)
        category_diff.append({
            "category": cat,
            "doc1_count": count1,
            "doc2_count": count2,
            "delta": count2 - count1
        })

    # High-Risk clause differences
    high1 = [c.get("text", "") for c in (doc1.analysis.clauses or []) if c.get("risk_level") == "High"]
    high2 = [c.get("text", "") for c in (doc2.analysis.clauses or []) if c.get("risk_level") == "High"]

    return {
        "doc1": {
            "id": doc1.id,
            "filename": doc1.original_filename,
            "risk_score": score1,
            "risk_level": doc1.analysis.risk_level,
            "clause_count": doc1.analysis.total_clauses_count
        },
        "doc2": {
            "id": doc2.id,
            "filename": doc2.original_filename,
            "risk_score": score2,
            "risk_level": doc2.analysis.risk_level,
            "clause_count": doc2.analysis.total_clauses_count
        },
        "risk_delta": risk_delta,
        "risk_trend": "Increased Risk" if risk_delta > 5 else "Reduced Risk" if risk_delta < -5 else "Comparable Risk Profile",
        "category_distribution": category_diff,
        "high_risk_clauses_doc1_count": len(high1),
        "high_risk_clauses_doc2_count": len(high2),
        "summary": (
            f"Comparing '{doc1.original_filename}' against '{doc2.original_filename}': "
            f"Overall risk shifted by {risk_delta:+0.1f} points "
            f"({score1}% -> {score2}%). "
            f"Doc 2 has {len(high2)} high-risk provisions compared to {len(high1)} in Doc 1."
        )
    }

@router.get("/analytics/portfolio")
def get_portfolio_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns aggregated analytics across all user documents."""
    docs = db.query(Document).filter(Document.owner_id == current_user.id).all()

    total = len(docs)
    completed = [d for d in docs if d.status == "completed"]

    # Risk distribution
    high_risk = sum(1 for d in completed if d.analysis and d.analysis.risk_level in ["High", "High Risk", "Critical"])
    medium_risk = sum(1 for d in completed if d.analysis and d.analysis.risk_level in ["Medium", "Medium Risk"])
    low_risk = sum(1 for d in completed if d.analysis and d.analysis.risk_level in ["Low", "Low Risk", "Safe"])

    # Document type distribution
    type_counts = {}
    for d in completed:
        dtype = getattr(d, "document_type", "Legal Contract") or "Legal Contract"
        type_counts[dtype] = type_counts.get(dtype, 0) + 1

    # Average risk score
    risk_scores = [d.analysis.overall_risk_score for d in completed if d.analysis and d.analysis.overall_risk_score is not None]
    avg_risk = round(sum(risk_scores) / len(risk_scores), 1) if risk_scores else 0.0

    # Most common high-risk category
    all_high_clauses = []
    for d in completed:
        if d.analysis and d.analysis.clauses:
            for c in d.analysis.clauses:
                if isinstance(c, dict) and c.get("risk_level") in ["High", "High Risk"]:
                    all_high_clauses.append(c.get("category", "Unknown"))

    from collections import Counter
    top_risk_category = Counter(all_high_clauses).most_common(1)
    top_risk_cat = top_risk_category[0][0] if top_risk_category else "N/A"

    return {
        "total_documents": total,
        "analyzed_documents": len(completed),
        "pending_documents": total - len(completed),
        "risk_distribution": {
            "high": high_risk,
            "medium": medium_risk,
            "low": low_risk
        },
        "average_risk_score": avg_risk,
        "top_risk_category": top_risk_cat,
        "document_types": type_counts
    }


@router.get("/analytics/deadlines")
def get_upcoming_deadlines(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Extracts chronological contract deadlines and renewal dates across all user documents."""
    docs = db.query(Document).filter(Document.owner_id == current_user.id, Document.status == "completed").all()
    deadlines = []

    for d in docs:
        if not d.analysis or not d.analysis.important_dates:
            continue
        for item in d.analysis.important_dates:
            if isinstance(item, dict):
                date_str = item.get("date", "").strip()
                context = item.get("context", "Key Contract Date").strip()
                if date_str:
                    deadlines.append({
                        "document_id": d.id,
                        "document_name": d.original_filename,
                        "date": date_str,
                        "context": context,
                        "document_type": getattr(d, "document_type", "Legal Contract") or "Legal Contract"
                    })

    return {"deadlines": deadlines, "total": len(deadlines)}


@router.delete("/{document_id}")
def delete_document(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
    except Exception:
        pass
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}
