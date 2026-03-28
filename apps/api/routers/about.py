"""소개 페이지 공개 API (인증 불필요)."""
from fastapi import APIRouter, Depends
from sqlalchemy import text

from apps.api.core import get_db

router = APIRouter(prefix="/about", tags=["about"])

KEY_PROJECTS_CAREERS_INTRO = "projects_careers_intro"

# 포트폴리오 페이지 이력서/포트폴리오 버튼용
KEY_PORTFOLIO_RESUME_LINK = "portfolio_resume_link"
KEY_PORTFOLIO_PORTFOLIO_LINK = "portfolio_portfolio_link"
KEY_PORTFOLIO_RESUME_INTRO = "portfolio_resume_intro"
KEY_PORTFOLIO_PORTFOLIO_INTRO = "portfolio_portfolio_intro"
PORTFOLIO_LINK_KEYS = (
    KEY_PORTFOLIO_RESUME_LINK,
    KEY_PORTFOLIO_PORTFOLIO_LINK,
    KEY_PORTFOLIO_RESUME_INTRO,
    KEY_PORTFOLIO_PORTFOLIO_INTRO,
)


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


@router.get("/portfolio-links")
def get_portfolio_links(db=Depends(get_db)):
    """포트폴리오 페이지 이력서/포트폴리오 링크·소개 문구 (공개). 키 없어도 에러 없이 빈 문자열 반환."""
    rows = db.execute(
        text(
            "SELECT `key`, value FROM site_settings WHERE `key` IN "
            "(:k0, :k1, :k2, :k3)"
        ),
        {
            "k0": KEY_PORTFOLIO_RESUME_LINK,
            "k1": KEY_PORTFOLIO_PORTFOLIO_LINK,
            "k2": KEY_PORTFOLIO_RESUME_INTRO,
            "k3": KEY_PORTFOLIO_PORTFOLIO_INTRO,
        },
    ).fetchall()
    by_key = {r[0]: (r[1] or "").strip() for r in rows}
    return {
        "resume_link": by_key.get(KEY_PORTFOLIO_RESUME_LINK, ""),
        "portfolio_link": by_key.get(KEY_PORTFOLIO_PORTFOLIO_LINK, ""),
        "resume_intro": by_key.get(KEY_PORTFOLIO_RESUME_INTRO, ""),
        "portfolio_intro": by_key.get(KEY_PORTFOLIO_PORTFOLIO_INTRO, ""),
    }
