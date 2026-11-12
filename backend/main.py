#!/usr/bin/env python3
"""
Entry point for uvicorn.
Run with:  uvicorn main:app --reload --port 8000
Or use:    python main.py
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

# Also expose `app` so `uvicorn main:app` works directly
from app.main import app  # noqa: E402, F401

