import re
import time
from typing import Dict, List
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from datetime import timedelta
from app.database import get_db
from app.models.user import User
from app.utils.auth import verify_password, get_password_hash, create_access_token, get_current_user
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# In-memory sliding-window brute-force defense
_login_failures: Dict[str, List[float]] = defaultdict(list)
MAX_FAILURES_PER_MINUTE = 5
LOCKOUT_WINDOW_SECONDS = 60

def verify_rate_limit(client_ip: str):
    now = time.time()
    # Filter out timestamps outside the rolling lockout window
    _login_failures[client_ip] = [t for t in _login_failures[client_ip] if now - t < LOCKOUT_WINDOW_SECONDS]
    if len(_login_failures[client_ip]) >= MAX_FAILURES_PER_MINUTE:
        remaining = int(LOCKOUT_WINDOW_SECONDS - (now - _login_failures[client_ip][0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Account temporarily locked for {max(1, remaining)} seconds."
        )

class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        clean = v.strip().lower()
        if not re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", clean):
            raise ValueError("Please provide a valid email address.")
        return clean

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        clean = v.strip()
        if len(clean) < 2:
            raise ValueError("Full name must be at least 2 characters.")
        return clean

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters.")
        return v

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    clean_email = user_data.email.strip().lower()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=clean_email,
        full_name=user_data.full_name.strip(),
        hashed_password=get_password_hash(user_data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "127.0.0.1"
    verify_rate_limit(client_ip)

    clean_username = form_data.username.strip().lower()
    user = db.query(User).filter(User.email == clean_username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        _login_failures[client_ip].append(time.time())
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Reset failure counter on successful authentication
    _login_failures.pop(client_ip, None)

    token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
