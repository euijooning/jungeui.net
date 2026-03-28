"""소개 메시지 Admin API (CRUD)."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text

from apps.api.core import get_db
from apps.api.routers.auth import get_current_user
from apps.api.routers.about import (
    KEY_PROJECTS_CAREERS_INTRO,
    KEY_PORTFOLIO_RESUME_LINK,
    KEY_PORTFOLIO_PORTFOLIO_LINK,
    KEY_PORTFOLIO_RESUME_INTRO,
    KEY_PORTFOLIO_PORTFOLIO_INTRO,
)

router = APIRouter(prefix="/about_messages", tags=["about_messages"])

INTRO_MAX_LENGTH = 20


class ProjectsCareersIntroBody(BaseModel):
    """프로젝트/경력 섹션 소개 문구 (최대 20자)."""
    text: str = Field(default="", max_length=20)


class AboutMessageBody(BaseModel):
    title: str = ""
    content: str = ""
    sort_order: int = 0


class PortfolioLinksBody(BaseModel):
    """포트폴리오 페이지 이력서/포트폴리오 링크·소개 (소개 20자 제한)."""
    resume_link: str | None = None
    portfolio_link: str | None = None
    resume_intro: str | None = None
    portfolio_intro: str | None = None


@router.put("/portfolio-links")
def update_portfolio_links(
    body: PortfolioLinksBody,
    db=Depends(get_db),
    user=Depends(get_current_user),
):
    """포트폴리오 링크·소개 문구 저장. 소개는 20자 초과 시 400."""
    resume_intro = (body.resume_intro or "").strip()[:INTRO_MAX_LENGTH]
    portfolio_intro = (body.portfolio_intro or "").strip()[:INTRO_MAX_LENGTH]
    if len((body.resume_intro or "").strip()) > INTRO_MAX_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"이력서 소개는 {INTRO_MAX_LENGTH}자 이하여야 합니다.",
        )
    if len((body.portfolio_intro or "").strip()) > INTRO_MAX_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"포트폴리오 소개는 {INTRO_MAX_LENGTH}자 이하여야 합니다.",
        )
    resume_link = (body.resume_link or "").strip()
    portfolio_link = (body.portfolio_link or "").strip()

    for key, value in [
        (KEY_PORTFOLIO_RESUME_LINK, resume_link),
        (KEY_PORTFOLIO_PORTFOLIO_LINK, portfolio_link),
        (KEY_PORTFOLIO_RESUME_INTRO, resume_intro),
        (KEY_PORTFOLIO_PORTFOLIO_INTRO, portfolio_intro),
    ]:
        db.execute(
            text("""
                INSERT INTO site_settings (`key`, value) VALUES (:key, :value)
                ON DUPLICATE KEY UPDATE value = :value
            """),
            {"key": key, "value": value},
        )
    db.commit()
    return {
        "resume_link": resume_link,
        "portfolio_link": portfolio_link,
        "resume_intro": resume_intro,
        "portfolio_intro": portfolio_intro,
    }


@router.get("")
def list_messages(db=Depends(get_db), user=Depends(get_current_user)):
    """메시지 목록 (Admin)."""
    rows = db.execute(
        text("SELECT id, title, content, sort_order, created_at, updated_at FROM about_messages ORDER BY sort_order, id")
    ).fetchall()
    return [
        {
            "id": r[0],
            "title": r[1],
            "content": r[2],
            "sort_order": r[3],
            "created_at": r[4].isoformat() if r[4] else None,
            "updated_at": r[5].isoformat() if r[5] else None,
        }
        for r in rows
    ]


@router.post("")
def create_message(body: AboutMessageBody, db=Depends(get_db), user=Depends(get_current_user)):
    """메시지 생성 (Admin)."""
    db.execute(
        text("""
            INSERT INTO about_messages (title, content, sort_order)
            VALUES (:title, :content, :sort_order)
        """),
        {"title": body.title or "", "content": body.content or "", "sort_order": body.sort_order},
    )
    db.commit()
    return {"message": "created"}


@router.put("/projects-careers-intro")
def update_projects_careers_intro(body: ProjectsCareersIntroBody, db=Depends(get_db), user=Depends(get_current_user)):
    """프로젝트/경력 섹션 소개 문구 저장 (최대 20자)."""
    value = (body.text or "").strip()[:20]
    db.execute(
        text("""
            INSERT INTO site_settings (`key`, value) VALUES (:key, :value)
            ON DUPLICATE KEY UPDATE value = :value
        """),
        {"key": KEY_PROJECTS_CAREERS_INTRO, "value": value},
    )
    db.commit()
    return {"text": value}


@router.put("/{message_id}")
def update_message(message_id: int, body: AboutMessageBody, db=Depends(get_db), user=Depends(get_current_user)):
    """메시지 수정 (Admin)."""
    r = db.execute(
        text("SELECT id FROM about_messages WHERE id = :id"),
        {"id": message_id},
    ).fetchone()
    if not r:
        raise HTTPException(status_code=404, detail="메시지를 찾을 수 없습니다.")
    db.execute(
        text("""
            UPDATE about_messages SET title = :title, content = :content, sort_order = :sort_order
            WHERE id = :id
        """),
        {"id": message_id, "title": body.title or "", "content": body.content or "", "sort_order": body.sort_order},
    )
    db.commit()
    return {"message": "updated"}


@router.delete("/{message_id}")
def delete_message(message_id: int, db=Depends(get_db), user=Depends(get_current_user)):
    """메시지 삭제 (Admin)."""
    r = db.execute(text("SELECT id FROM about_messages WHERE id = :id"), {"id": message_id}).fetchone()
    if not r:
        raise HTTPException(status_code=404, detail="메시지를 찾을 수 없습니다.")
    db.execute(text("DELETE FROM about_messages WHERE id = :id"), {"id": message_id})
    db.commit()
    return {"message": "deleted"}
