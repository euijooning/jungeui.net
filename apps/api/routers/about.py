"""소개 페이지 공개 API (인증 불필요)."""
from fastapi import APIRouter, Depends
from sqlalchemy import text

from apps.api.core import get_db

router = APIRouter(prefix="/about", tags=["about"])


@router.get("/messages")
def list_about_messages(db=Depends(get_db)):
    """인사말 메시지 목록 (sort_order 순). 공개."""
    rows = db.execute(
        text("SELECT id, title, content, sort_order FROM about_messages ORDER BY sort_order, id")
    ).fetchall()
    return [
        {"id": r[0], "title": r[1], "content": r[2], "sort_order": r[3]}
        for r in rows
    ]
