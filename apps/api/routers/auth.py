"""인증 라우터 - 로그인/로그아웃/현재 사용자."""
import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy import text
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone

from apps.api.core import SECRET_KEY, get_db
from apps.api.core.config import (
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ACCESS_TOKEN_EXPIRE_DAYS_REMEMBER,
)

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)


class LoginRequest(BaseModel):
    username: str  # email
    password: str
    remember_me: bool = False  # True 시 30일 토큰, False 시 24h


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


def create_access_token(data: dict, remember_me: bool = False) -> str:
    to_encode = data.copy()
    now_utc = datetime.now(timezone.utc)
    if remember_me:
        expire = now_utc + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS_REMEMBER)
    else:
        expire = now_utc + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
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
    token = create_access_token(
        {"sub": str(user_id), "email": user_email},
        remember_me=body.remember_me,
    )
    db.execute(
        text("UPDATE users SET last_login_at = NOW() WHERE id = :id"),
        {"id": user_id},
    )
    db.commit()
    return LoginResponse(
        access_token=token,
        user={"id": user_id, "email": user_email, "name": name or "Admin"},
    )


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db=Depends(get_db),
):
    """Bearer 토큰이 있으면 사용자 반환, 없으면 None."""
    if not credentials or credentials.scheme.lower() != "bearer":
        return None
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        user_id = payload.get("sub")
        if not user_id:
            return None
    except JWTError:
        return None
    row = db.execute(
        text("SELECT id, email, name FROM users WHERE id = :id"),
        {"id": int(user_id)},
    ).fetchone()
    if not row:
        return None
    return {"id": row[0], "email": row[1], "name": (row[2] or "Admin")}


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db=Depends(get_db),
):
    """Bearer 토큰 검증 후 현재 사용자 반환. 없거나 유효하지 않으면 401."""
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        user_id = payload.get("sub")
        email = payload.get("email")
        if not user_id:
            raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
    except JWTError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
    row = db.execute(
        text("SELECT id, email, name FROM users WHERE id = :id"),
        {"id": int(user_id)},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다.")
    return {"id": row[0], "email": row[1], "name": (row[2] or "Admin")}


@router.get("/me")
def auth_me(user=Depends(get_current_user)):
    """현재 로그인한 사용자 정보 (Bearer 토큰 필요)."""
    return user
