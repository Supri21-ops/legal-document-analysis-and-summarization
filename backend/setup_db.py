#!/usr/bin/env python3
"""
Initialize the PostgreSQL database — creates all tables.
Run once before starting the backend server.

Usage:
    cd backend
    venv\\Scripts\\activate
    python setup_db.py
"""

import sys
import os

# Ensure app package is on the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
# Import all models so SQLAlchemy sees them before create_all()
from app.models import user, document  # noqa: F401


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("\n[OK] All tables created successfully!")
    print("\nTables:")
    for table in Base.metadata.sorted_tables:
        print(f"   - {table.name}")


if __name__ == "__main__":
    init_db()
