"""인증 라우터 - 로그인/로그아웃."""
import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from jose import jwt
from datetime import datetime, timedelta

from apps.api.core import SECRET_KEY, get_db
from apps.api.core.config import ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str  # email
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db=Depends(get_db)):
    email = body.username.strip()
    if not email or not body.password:
        raise HTTPException(status_code=400, detail="이메일과 비밀번호를 입력하세요.")
    row = db.execute(
        text("SELECT id, email, name, password_hash FROM users WHERE email = :email"),
        {"email": email},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    user_id, user_email, name, password_hash = row[0], row[1], row[2], row[3]
    if not bcrypt.checkpw(body.password.encode("utf-8"), password_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    token = create_access_token({"sub": str(user_id), "email": user_email})
    db.execute(
        text("UPDATE users SET last_login_at = NOW() WHERE id = :id"),
        {"id": user_id},
    )
    db.commit()
    return LoginResponse(
        access_token=token,
        user={"id": user_id, "email": user_email, "name": name or "Admin"},
    )
