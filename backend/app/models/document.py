from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer)
    file_type = Column(String)
    document_hash = Column(String, index=True)
    status = Column(String, default="uploaded")
    processing_step = Column(String, nullable=True, default="Uploaded")
    error_message = Column(Text, nullable=True)
    document_type = Column(String, default="Legal Contract")
    is_legal_contract = Column(Boolean, default=True)
    anomaly_warning = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="documents")
    analysis = relationship("DocumentAnalysis", back_populates="document", uselist=False)
    blockchain_record = relationship("BlockchainRecord", back_populates="document", uselist=False)

class DocumentAnalysis(Base):
    __tablename__ = "document_analyses"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    extracted_text = Column(Text)
    summary = Column(Text)
    parties = Column(JSON)
    important_dates = Column(JSON)
    obligations = Column(JSON)
    clauses = Column(JSON)
    entities = Column(JSON)
    overall_risk_score = Column(Float, default=0.0)
    risk_level = Column(String, default="Low")
    high_risk_clauses_count = Column(Integer, default=0)
    total_clauses_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    document = relationship("Document", back_populates="analysis")
    clauses_detail = relationship("ClauseAnalysis", back_populates="analysis")

class ClauseAnalysis(Base):
    __tablename__ = "clause_analyses"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("document_analyses.id"), nullable=False)
    clause_text = Column(Text, nullable=False)
    clause_category = Column(String)
    risk_level = Column(String, default="Low")
    risk_score = Column(Float, default=0.0)
    explanation = Column(Text)
    position_start = Column(Integer)
    position_end = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    analysis = relationship("DocumentAnalysis", back_populates="clauses_detail")

class BlockchainRecord(Base):
    __tablename__ = "blockchain_records"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    document_hash = Column(String, nullable=False)
    transaction_hash = Column(String)
    block_number = Column(Integer)
    blockchain_network = Column(String, default="Ganache Local")
    contract_address = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    is_verified = Column(Boolean, default=False)

    document = relationship("Document", back_populates="blockchain_record")
