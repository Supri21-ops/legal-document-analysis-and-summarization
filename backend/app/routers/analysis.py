from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import os
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.utils.auth import get_current_user
from app.services import genai_service

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])

class QuestionRequest(BaseModel):
    question: str

class ChatMessage(BaseModel):
    role: str # "user" or "assistant"
    content: str

class MultiTurnChatRequest(BaseModel):
    messages: List[ChatMessage]

class ClauseExplainRequest(BaseModel):
    clause_text: str

class ClauseRewriteRequest(BaseModel):
    clause_text: str
    risk_tolerance: str = "balanced"  # aggressive, balanced, conservative

class ExportRedraftRequest(BaseModel):
    original_clause: str
    rewritten_clause: str
    risk_tolerance: Optional[str] = "balanced"

@router.post("/{document_id}/ask")
def ask_question(
    document_id: int,
    request: QuestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not doc.analysis:
        raise HTTPException(status_code=400, detail="Document not yet analyzed")
    answer = genai_service.answer_question(document_id, request.question, doc.analysis.extracted_text or "")
    return {"question": request.question, "answer": answer}

@router.post("/{document_id}/chat")
def multi_turn_chat(
    document_id: int,
    request: MultiTurnChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Multi-turn conversational Contract Co-Pilot with persistent RAG context."""
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not doc.analysis:
        raise HTTPException(status_code=400, detail="Document not yet analyzed")

    messages_data = [{"role": m.role, "content": m.content} for m in request.messages]
    reply = genai_service.chat_with_document(document_id, messages_data, doc.analysis.extracted_text or "")
    return {"reply": reply}

@router.post("/{document_id}/export-redrafted")
def export_redrafted(
    document_id: int,
    request: ExportRedraftRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exports updated contract with revision summary and replaced clause as .docx."""
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    text = doc.analysis.extracted_text if doc.analysis and doc.analysis.extracted_text else ""
    if not text and doc.file_path and os.path.exists(doc.file_path):
        try:
            from app.utils.file_handler import extract_text_from_file
            text = extract_text_from_file(doc.file_path, doc.file_type)
        except Exception:
            text = ""

    if not text:
        text = f"Contract: {doc.original_filename}\n\n{request.rewritten_clause}"

    buf = genai_service.create_redrafted_docx(
        filename=doc.original_filename,
        full_text=text,
        original_clause=request.original_clause,
        rewritten_clause=request.rewritten_clause,
        risk_tolerance=request.risk_tolerance or "balanced"
    )

    base_name = os.path.splitext(doc.original_filename)[0]
    safe_filename = f"{base_name}_Redrafted.docx"

    return Response(
        content=buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@router.post("/explain-clause")
def explain_clause(request: ClauseExplainRequest, current_user: User = Depends(get_current_user)):
    explanation = genai_service.explain_clause(request.clause_text)
    return {"clause": request.clause_text, "explanation": explanation}

@router.post("/explain-clause/stream")
async def explain_clause_stream(
    request: ClauseExplainRequest,
    current_user: User = Depends(get_current_user)
):
    """Stream plain-English clause explanation token by token."""
    import json

    async def generate():
        try:
            # Try streaming via Gemini REST API
            import urllib.request
            from app.config import settings

            if settings.GEMINI_API_KEY:
                prompt = f"""Explain this legal clause in clear, simple plain English for a business executive. Use 3 short paragraphs:
1. What rights or duties this creates (start with "This clause...")
2. What potential business risk exists (start with "The key risk...")
3. What protective counter-measure is recommended (start with "To protect yourself...")

Clause:
"{request.clause_text[:2000]}"
"""
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:streamGenerateContent?key={settings.GEMINI_API_KEY}&alt=sse"
                payload = json.dumps({
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"maxOutputTokens": 500}
                }).encode("utf-8")
                req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
                try:
                    with urllib.request.urlopen(req, timeout=20) as resp:
                        for line in resp:
                            line = line.decode("utf-8").strip()
                            if line.startswith("data: "):
                                data_str = line[6:]
                                if data_str == "[DONE]":
                                    break
                                try:
                                    data = json.loads(data_str)
                                    candidates = data.get("candidates", [])
                                    if candidates:
                                        parts = candidates[0].get("content", {}).get("parts", [])
                                        for part in parts:
                                            if "text" in part and part["text"]:
                                                yield f"data: {json.dumps({'token': part['text']})}\n\n"
                                except Exception:
                                    continue
                        yield "data: [DONE]\n\n"
                        return
                except Exception:
                    pass

            # Fallback: send full response as single chunk, simulated word-by-word streaming
            explanation = genai_service.explain_clause(request.clause_text)
            words = explanation.split(" ")
            for i, word in enumerate(words):
                chunk = word + (" " if i < len(words) - 1 else "")
                yield f"data: {json.dumps({'token': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/rewrite-clause")
def rewrite_clause(request: ClauseRewriteRequest, current_user: User = Depends(get_current_user)):
    """AI-powered clause redraft with configurable risk tolerance."""
    result = genai_service.rewrite_clause(request.clause_text, request.risk_tolerance)
    return result

@router.get("/{document_id}/clauses")
def get_clauses(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if not doc or not doc.analysis:
        raise HTTPException(status_code=404, detail="Document or analysis not found")
    return {"clauses": doc.analysis.clauses, "total": doc.analysis.total_clauses_count}

@router.get("/{document_id}/summary")
def get_summary(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if not doc or not doc.analysis:
        raise HTTPException(status_code=404, detail="Document or analysis not found")
    return {"summary": doc.analysis.summary}

@router.get("/{document_id}/risk")
def get_risk(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if not doc or not doc.analysis:
        raise HTTPException(status_code=404, detail="Document or analysis not found")
    return {
        "overall_risk_score": doc.analysis.overall_risk_score,
        "risk_level": doc.analysis.risk_level,
        "high_risk_clauses_count": doc.analysis.high_risk_clauses_count,
        "total_clauses_count": doc.analysis.total_clauses_count
    }

@router.get("/{document_id}/recommendations")
def get_recommendations(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if not doc or not doc.analysis:
        raise HTTPException(status_code=404, detail="Document or analysis not found")
    clauses = doc.analysis.clauses or []
    risk_summary = {
        "overall_risk_score": doc.analysis.overall_risk_score,
        "risk_level": doc.analysis.risk_level,
        "high_risk_clauses": [c for c in clauses if c.get("risk_level") == "High"]
    }
    recommendations = genai_service.generate_recommendations(clauses, risk_summary)
    return {"recommendations": recommendations}
