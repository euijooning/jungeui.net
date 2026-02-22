"""소개 페이지 공개 API (인증 불필요)."""
from fastapi import APIRouter, Depends
from sqlalchemy import text

from apps.api.core import get_db

router = APIRouter(prefix="/about", tags=["about"])

KEY_PROJECTS_CAREERS_INTRO = "projects_careers_intro"


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


@router.get("/projects-careers-intro")
def get_projects_careers_intro(db=Depends(get_db)):
    """프로젝트/경력 섹션 소개 문구 한 줄 (공개, 최대 20자)."""
    row = db.execute(
        text("SELECT value FROM site_settings WHERE `key` = :key"),
        {"key": KEY_PROJECTS_CAREERS_INTRO},
    ).fetchone()
    return {"text": (row[0] or "").strip() if row else ""}
