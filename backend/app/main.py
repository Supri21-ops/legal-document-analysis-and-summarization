from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, documents, analysis, blockchain
from app.config import settings

app = FastAPI(
    title="Legal Document Analysis API",
    version="2.0.0",
    description="Intelligent Legal Document Analysis using NLP, AI/ML, GenAI & Blockchain",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS - Allow specified frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(analysis.router)
app.include_router(blockchain.router)

@app.get("/")
def root():
    return {
        "message": "Legal Document Analysis API",
        "version": "2.0.0",
        "docs": "/docs",
        "technologies": "NLP (spaCy & Legal Suite), AI/ML (Risk Scoring & Classification), GenAI (Google Gemini & Claude & RAG), Blockchain (Ethereum / Ganache)"
    }

@app.get("/api/health")
def health_check():
    from app.services import nlp_service, genai_service, blockchain_service
    from app.database import engine
    from sqlalchemy import text

    # DB Check
    db_ok = False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_ok = True
    except Exception:
        db_ok = False

    # NLP Check
    nlp_model = "spaCy (Active)" if nlp_service.get_nlp() is not None else "Legal NLP Rule Suite (Active)"

    # GenAI Check
    genai_provider = "Google Gemini 2.0 Flash (Cloud Live)" if settings.GEMINI_API_KEY else \
                     "Anthropic Claude 3.5 (Cloud Live)" if settings.ANTHROPIC_API_KEY else \
                     "LegalAI Extractive Intelligence Engine (Local RAG)"

    # Blockchain Check
    bc_status = blockchain_service.get_blockchain_status()

    return {
        "status": "healthy" if db_ok else "degraded",
        "version": "2.0.0",
        "database": "connected" if db_ok else "unreachable",
        "nlp_engine": nlp_model,
        "genai_provider": genai_provider,
        "vector_search": "TF-IDF + Cosine Similarity RAG (In-Memory)",
        "blockchain_network": bc_status.get("network", "Unknown"),
        "blockchain_connected": bc_status.get("connected", False)
    }
