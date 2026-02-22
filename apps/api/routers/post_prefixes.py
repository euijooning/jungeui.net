"""말머리(prefix) API."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

from apps.api.core import get_db
from apps.api.routers.auth import get_current_user

router = APIRouter(tags=["post_prefixes"])

PREFIX_NAME_MAX_LEN = 20


class PostPrefixCreate(BaseModel):
    name: str = ""


class PostPrefixUpdate(BaseModel):
    name: str | None = None


def _validate_name(name: str) -> str:
    s = (name or "").strip()
    if not s:
        raise HTTPException(status_code=400, detail="말머리 이름을 입력하세요.")
    if len(s) > PREFIX_NAME_MAX_LEN:
        raise HTTPException(
            status_code=400,
            detail=f"말머리는 최대 {PREFIX_NAME_MAX_LEN}자까지 입력할 수 있습니다.",
        )
    return s


@router.get("")
def list_post_prefixes(db=Depends(get_db)):
    """말머리 목록. 정렬 순서·이름 순, 각 항목에 post_count 포함."""
    rows = db.execute(
        text("""
            SELECT pp.id, pp.name, pp.sort_order, pp.created_at,
                   COUNT(p.id) AS post_count
            FROM post_prefixes pp
            LEFT JOIN posts p ON p.prefix_id = pp.id
            GROUP BY pp.id, pp.name, pp.sort_order, pp.created_at
            ORDER BY pp.sort_order, pp.id
        """)
    ).fetchall()
    return [
        {
            "id": r[0],
            "name": r[1],
            "sort_order": r[2],
            "created_at": r[3].isoformat()[:19] if hasattr(r[3], "isoformat") else r[3],
            "post_count": int(r[4]) if r[4] is not None else 0,
        }
        for r in rows
    ]


@router.post("", status_code=201)
def create_post_prefix(
    body: PostPrefixCreate,
    db=Depends(get_db),
    user=Depends(get_current_user),
):
    """말머리 생성 (관리자)."""
    name = _validate_name(body.name or "")
    db.execute(
        text("INSERT INTO post_prefixes (name, sort_order) VALUES (:name, 0)"),
        {"name": name},
    )
    db.commit()
    row = db.execute(
        text("SELECT id, name, sort_order, created_at FROM post_prefixes WHERE name = :name ORDER BY id DESC LIMIT 1"),
        {"name": name},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=500, detail="말머리 생성 후 조회에 실패했습니다.")
    return {"id": row[0], "name": row[1], "sort_order": row[2], "created_at": row[3]}


@router.get("/{prefix_id}")
def get_post_prefix(prefix_id: int, db=Depends(get_db)):
    """말머리 단건."""
    row = db.execute(
        text("SELECT id, name, sort_order, created_at FROM post_prefixes WHERE id = :id"),
        {"id": prefix_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="말머리를 찾을 수 없습니다.")
    return {"id": row[0], "name": row[1], "sort_order": row[2], "created_at": row[3]}


@router.put("/{prefix_id}")
def update_post_prefix(
    prefix_id: int,
    body: PostPrefixUpdate,
    db=Depends(get_db),
    user=Depends(get_current_user),
):
    """말머리 수정 (관리자)."""
    row = db.execute(
        text("SELECT id, name FROM post_prefixes WHERE id = :id"),
        {"id": prefix_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="말머리를 찾을 수 없습니다.")
    if body.name is None:
        return {"id": row[0], "name": row[1]}
    name = _validate_name(body.name)
    db.execute(text("UPDATE post_prefixes SET name = :name WHERE id = :id"), {"name": name, "id": prefix_id})
    db.commit()
    return {"id": prefix_id, "name": name}


@router.delete("/{prefix_id}")
def delete_post_prefix(
    prefix_id: int,
    db=Depends(get_db),
    user=Depends(get_current_user),
):
    """말머리 삭제 (관리자). 삭제 시 해당 말머리를 쓰던 글은 prefix_id=NULL로 유지."""
    row = db.execute(
        text("SELECT 1 FROM post_prefixes WHERE id = :id"),
        {"id": prefix_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="말머리를 찾을 수 없습니다.")
    db.execute(text("DELETE FROM post_prefixes WHERE id = :id"), {"id": prefix_id})
    db.commit()
    return None
