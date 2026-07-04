from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import jwt
from datetime import datetime, timedelta
import os
from app.services.db import get_db
from sqlalchemy.orm import Session
from app.models.parents import Parent
from app.models.builders import Builder

router = APIRouter(prefix="/auth", tags=["authentication"])

class LoginRequest(BaseModel):
    email: str
    role: str
    supabase_user_id: str

class SignupRequest(BaseModel):
    email: str
    name: str
    role: str
    supabase_user_id: str

class AuthResponse(BaseModel):
    message: str
    user_id: str
    role: str
    token: Optional[str] = None

# Simple JWT secret (in production, use environment variable)
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-this")

@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Sync user login with FastAPI backend
    """
    try:
        # Here you would typically:
        # 1. Validate the user exists in your database
        # 2. Create/update user record
        # 3. Generate JWT token
        
        # For now, we'll create a simple JWT token
        token_data = {
            "user_id": request.supabase_user_id,
            "email": request.email,
            "role": request.role,
            "exp": datetime.utcnow() + timedelta(hours=24)
        }
        
        token = jwt.encode(token_data, JWT_SECRET, algorithm="HS256")
        
        return AuthResponse(
            message=f"Login successful for {request.role}",
            user_id=request.supabase_user_id,
            role=request.role,
            token=token
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """
    Sync user signup with FastAPI backend
    """
    try:
        # Here you would typically:
        # 1. Create user record in your database
        if request.role == 'parent':
            if not db.query(Parent).filter(Parent.email == request.email).first():
                parent = Parent(email=request.email, name=request.name, family_id=1)
                db.add(parent)
                db.commit()
        elif request.role == 'builder':
            if not db.query(Builder).filter(Builder.email == request.email).first():
                builder = Builder(email=request.email, name=request.name)
                db.add(builder)
                db.commit()
        # 2. Set up role-specific data
        # 3. Generate JWT token
        
        token_data = {
            "user_id": request.supabase_user_id,
            "email": request.email,
            "role": request.role,
            "name": request.name,
            "exp": datetime.utcnow() + timedelta(hours=24)
        }
        
        token = jwt.encode(token_data, JWT_SECRET, algorithm="HS256")
        
        return AuthResponse(
            message=f"Signup successful for {request.role}",
            user_id=request.supabase_user_id,
            role=request.role,
            token=token
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/verify")
async def verify_token(token: str):
    """
    Verify JWT token
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return {
            "valid": True,
            "user_id": payload.get("user_id"),
            "role": payload.get("role"),
            "email": payload.get("email")
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/logout")
async def logout():
    """
    Logout endpoint (client should remove token)
    """
    return {"message": "Logout successful"}
