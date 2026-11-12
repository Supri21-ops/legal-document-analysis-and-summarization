import os
import hashlib
import aiofiles
from fastapi import UploadFile, HTTPException
from app.config import settings

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}

def get_file_extension(filename: str) -> str:
    return os.path.splitext(filename)[1].lower() if filename else ""

def validate_file(file: UploadFile):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename cannot be empty")
    ext = get_file_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type '{ext}' not allowed. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}")

async def save_upload_file(file: UploadFile, user_id: int):
    """
    Secure streamed file upload:
    - Checks file.size metadata upfront if available
    - Streams in 64KB chunks directly to disk
    - Computes SHA-256 hash incrementally without loading full file into memory
    - Enforces strict byte ceiling to prevent memory-exhaustion DoS
    """
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file.size and file.size > max_bytes:
        raise HTTPException(status_code=400, detail=f"File too large ({round(file.size / (1024*1024), 1)}MB). Max allowed: {settings.MAX_FILE_SIZE_MB}MB")

    upload_dir = os.path.join(settings.UPLOAD_DIR, str(user_id))
    os.makedirs(upload_dir, exist_ok=True)

    sha256 = hashlib.sha256()
    total_size = 0
    temp_path = os.path.join(upload_dir, f"tmp_{os.urandom(8).hex()}")

    try:
        async with aiofiles.open(temp_path, "wb") as f:
            while True:
                chunk = await file.read(65536)
                if not chunk:
                    break
                total_size += len(chunk)
                if total_size > max_bytes:
                    raise HTTPException(status_code=400, detail=f"File exceeded size limit of {settings.MAX_FILE_SIZE_MB}MB during upload.")
                sha256.update(chunk)
                await f.write(chunk)
    except Exception:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
        raise

    final_hash = sha256.hexdigest()
    ext = get_file_extension(file.filename or ".txt")
    final_filename = f"{final_hash}{ext}"
    final_path = os.path.join(upload_dir, final_filename)

    if os.path.exists(final_path):
        try:
            os.remove(temp_path)
        except Exception:
            pass
    else:
        os.rename(temp_path, final_path)

    return final_path, final_hash, total_size
