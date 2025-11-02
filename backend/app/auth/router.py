"""
Authentication Router
====================

Provides basic authentication endpoints for login/logout.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
import jwt
from datetime import datetime, timedelta
import os

router = APIRouter()

# JWT configuration
SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


class LoginRequest(BaseModel):
    """Login request model"""
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Login response model"""
    user: dict
    token: str


class User(BaseModel):
    """User model"""
    id: int
    email: str
    name: str
    role: str


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Login endpoint

    For demo purposes, accepts any email/password combination.
    In production, this should validate against a real database.
    """
    # Demo user - accept any credentials
    user = {
        "id": 1,
        "email": request.email,
        "name": "Demo User",
        "role": "user"
    }

    # Create JWT token
    access_token = create_access_token(
        data={"sub": request.email, "user_id": 1, "role": "user"}
    )

    return {
        "user": user,
        "token": access_token
    }


@router.post("/logout")
async def logout():
    """Logout endpoint (client-side token removal)"""
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_current_user():
    """Get current user info (placeholder)"""
    return {
        "id": 1,
        "email": "demo@literacy.com",
        "name": "Demo User",
        "role": "user"
    }
