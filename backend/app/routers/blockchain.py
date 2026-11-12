import hashlib
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.document import Document, BlockchainRecord
from app.utils.auth import get_current_user
from app.services import blockchain_service

router = APIRouter(prefix="/api/blockchain", tags=["Blockchain"])

@router.get("/status")
def get_blockchain_status(current_user: User = Depends(get_current_user)):
    return blockchain_service.get_blockchain_status()

@router.get("/records")
def get_all_records(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    records = db.query(BlockchainRecord).join(Document).filter(Document.owner_id == current_user.id).all()
    return [{
        "document_id": r.document_id,
        "original_filename": r.document.original_filename if r.document else "Unknown",
        "document_hash": r.document_hash,
        "transaction_hash": r.transaction_hash,
        "block_number": r.block_number,
        "network": r.blockchain_network,
        "timestamp": r.timestamp.isoformat() if r.timestamp else None,
        "is_verified": r.is_verified,
    } for r in records]

@router.get("/document/{document_id}")
def get_document_blockchain_record(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.query(BlockchainRecord).filter(BlockchainRecord.document_id == document_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="No blockchain record found")
    return {
        "document_hash": record.document_hash,
        "transaction_hash": record.transaction_hash,
        "block_number": record.block_number,
        "network": record.blockchain_network,
        "timestamp": record.timestamp.isoformat() if record.timestamp else None,
        "is_verified": record.is_verified
    }

@router.post("/verify/{document_id}")
async def verify_document(
    document_id: int,
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    record = db.query(BlockchainRecord).filter(BlockchainRecord.document_id == document_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="No blockchain record found for this document")

    computed_hash = None
    if file is not None:
        file_bytes = await file.read()
        computed_hash = hashlib.sha256(file_bytes).hexdigest()
    elif os.path.exists(doc.file_path):
        with open(doc.file_path, "rb") as f:
            computed_hash = hashlib.sha256(f.read()).hexdigest()
    else:
        computed_hash = doc.document_hash

    result = blockchain_service.verify_document_hash(
        document_id=str(document_id),
        stored_hash=record.document_hash,
        provided_hash=computed_hash,
        transaction_hash=record.transaction_hash
    )
    return result
