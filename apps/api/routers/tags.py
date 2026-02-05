"""태그 API."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

from apps.api.core import get_db

router = APIRouter(tags=["tags"])


class CreateTagRequest(BaseModel):
    name: str


@router.get("")
def list_tags(db=Depends(get_db)):
    """태그 목록."""
    rows = db.execute(text("SELECT id, name, created_at FROM tags ORDER BY name")).fetchall()
    return [{"id": r[0], "name": r[1], "created_at": r[2]} for r in rows]


@router.post("")
def create_tag(body: CreateTagRequest, db=Depends(get_db)):
    """태그 생성. 이미 같은 name이 있으면 해당 id 반환."""
    name = (body.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="태그명을 입력하세요.")
    row = db.execute(
        text("SELECT id, name FROM tags WHERE name = :name"),
        {"name": name},
    ).fetchone()
    if row:
        return {"id": row[0], "name": row[1]}
    db.execute(
        text("INSERT INTO tags (name) VALUES (:name)"),
        {"name": name},
    )
    db.commit()
    new_row = db.execute(
        text("SELECT id, name FROM tags WHERE name = :name"),
        {"name": name},
    ).fetchone()
    if not new_row:
        raise HTTPException(status_code=500, detail="태그 생성에 실패했습니다.")
    return {"id": new_row[0], "name": new_row[1]}
