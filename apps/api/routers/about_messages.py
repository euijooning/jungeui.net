"""소개 메시지 Admin API (CRUD)."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text

from apps.api.core import get_db
from apps.api.routers.auth import get_current_user
from apps.api.routers.about import KEY_PROJECTS_CAREERS_INTRO

router = APIRouter(prefix="/about_messages", tags=["about_messages"])


class ProjectsCareersIntroBody(BaseModel):
    """프로젝트/경력 섹션 소개 문구 (최대 20자)."""
    text: str = Field(default="", max_length=20)


class AboutMessageBody(BaseModel):
    title: str = ""
    content: str = ""
    sort_order: int = 0


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
