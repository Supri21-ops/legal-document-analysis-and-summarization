import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List

_backend_dir = Path(__file__).resolve().parent.parent
_env_file = _backend_dir / ".env"

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./legal_db.db"
    GEMINI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    SECRET_KEY: str = "legal_ai_secret_key_2026_jwt_token_auth"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    GANACHE_URL: str = "http://127.0.0.1:8545"
    CONTRACT_ADDRESS: str = ""
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 50
    HUGGINGFACE_MODEL: str = "nlpaueb/legal-bert-base-uncased"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    CORS_ORIGINS: List[str] = ["http://localhost:4200", "http://localhost:3000"]

    class Config:
        env_file = str(_env_file) if _env_file.exists() else ".env"
        extra = "ignore"

settings = Settings()
