import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import settings

db_url = settings.DATABASE_URL
# If using a relative SQLite database URL, resolve it relative to backend root
if db_url.startswith("sqlite:///./") or db_url == "sqlite:///legal_db.db":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    rel_name = db_url.replace("sqlite:///./", "").replace("sqlite:///", "")
    abs_db_path = os.path.join(base_dir, rel_name).replace("\\", "/")
    db_url = f"sqlite:///{abs_db_path}"

connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
engine = create_engine(db_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
