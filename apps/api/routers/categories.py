"""카테고리 API (대/소 계층, CRUD, reorder)."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from apps.api.core import get_db
from apps.api.routers.auth import get_current_user

router = APIRouter(tags=["categories"])


class CategoryCreate(BaseModel):
    name: str = ""
    parent_id: int | None = None
    sort_order: int | None = None


class CategoryUpdate(BaseModel):
    name: str | None = None
    parent_id: int | None = None
    sort_order: int | None = None


class ReorderItem(BaseModel):
    id: int
    sort_order: int


class ReorderBody(BaseModel):
    order: list[ReorderItem]


def _row_to_item(r) -> dict:
    return {
        "id": r[0],
        "parent_id": r[1],
        "name": r[2],
        "sort_order": r[3],
    }


@router.get("")
def list_categories(tree: bool = False, db=Depends(get_db)):
    """카테고리 목록. tree=true면 계층 구조(children)로 반환."""
    rows = db.execute(
        text("""
            SELECT id, parent_id, name, sort_order
            FROM categories
            ORDER BY sort_order, id
        """)
    ).fetchall()
    items = [_row_to_item(r) for r in rows]

    if tree:
        by_parent = {}
        for it in items:
            pid = it["parent_id"]
            if pid not in by_parent:
                by_parent[pid] = []
            by_parent[pid].append(it)
        roots = sorted(by_parent.get(None, []), key=lambda x: (x["sort_order"], x["id"]))
        for it in roots:
            it["children"] = sorted(by_parent.get(it["id"], []), key=lambda x: (x["sort_order"], x["id"]))
        return roots
    return items


@router.post("", status_code=201)
def create_category(
    body: CategoryCreate,
    db=Depends(get_db),
    user=Depends(get_current_user),
):
    """카테고리 생성 (관리자)."""
    name = (body.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="카테고리명을 입력하세요.")

    if body.parent_id is not None:
        r = db.execute(text("SELECT 1 FROM categories WHERE id = :id"), {"id": body.parent_id}).fetchone()
        if not r:
            raise HTTPException(status_code=400, detail="상위 카테고리를 찾을 수 없습니다.")

    if body.sort_order is not None:
        next_order = body.sort_order
    else:
        if body.parent_id is None:
            row = db.execute(text("SELECT COALESCE(MAX(sort_order), -1) + 1 FROM categories WHERE parent_id IS NULL")).fetchone()
        else:
            row = db.execute(
                text("SELECT COALESCE(MAX(sort_order), -1) + 1 FROM categories WHERE parent_id = :pid"),
                {"pid": body.parent_id},
            ).fetchone()
        next_order = row[0] if row else 0

    try:
        db.execute(
            text("""
                INSERT INTO categories (parent_id, name, sort_order)
                VALUES (:parent_id, :name, :sort_order)
            """),
            {
                "parent_id": body.parent_id,
                "name": name,
                "sort_order": next_order,
            },
        )
        db.commit()
    except OperationalError as e:
        db.rollback()
        msg = str(e.orig) if getattr(e, "orig", None) else str(e)
        if "parent_id" in msg.lower() or "unknown column" in msg.lower():
            raise HTTPException(
                status_code=500,
                detail="categories 테이블에 parent_id 컬럼이 없습니다. 프로젝트 루트에서 python scripts/migrate_categories_add_parent_id.py 를 실행하세요.",
            ) from e
        raise

    row = db.execute(
        text("""
            SELECT id, parent_id, name, sort_order FROM categories
            WHERE name = :name AND ((:pid IS NULL AND parent_id IS NULL) OR parent_id = :pid)
            ORDER BY id DESC LIMIT 1
        """),
        {"name": name, "pid": body.parent_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=500, detail="카테고리 생성 후 조회에 실패했습니다.")
    return _row_to_item(row)


@router.get("/{category_id}")
def get_category(category_id: int, db=Depends(get_db)):
    """카테고리 단건."""
    row = db.execute(
        text("SELECT id, parent_id, name, sort_order FROM categories WHERE id = :id"),
        {"id": category_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다.")
    return _row_to_item(row)


@router.put("/{category_id}")
def update_category(
    category_id: int,
    body: CategoryUpdate,
    db=Depends(get_db),
    user=Depends(get_current_user),
):
    """카테고리 수정 (관리자)."""
    row = db.execute(
        text("SELECT id, parent_id, name, sort_order FROM categories WHERE id = :id"),
        {"id": category_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다.")

    updates = []
    params = {"id": category_id}
    if body.name is not None:
        name = body.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="카테고리명을 입력하세요.")
        updates.append("name = :name")
        params["name"] = name
    if "parent_id" in body.model_fields_set:
        if body.parent_id == category_id:
            raise HTTPException(status_code=400, detail="자기 자신을 상위로 지정할 수 없습니다.")
        if body.parent_id is not None:
            r = db.execute(text("SELECT 1 FROM categories WHERE id = :id"), {"id": body.parent_id}).fetchone()
            if not r:
                raise HTTPException(status_code=400, detail="상위 카테고리를 찾을 수 없습니다.")
        updates.append("parent_id = :parent_id")
        params["parent_id"] = body.parent_id
    if body.sort_order is not None:
        updates.append("sort_order = :sort_order")
        params["sort_order"] = body.sort_order

    if not updates:
        return _row_to_item(row)
    db.execute(
        text("UPDATE categories SET " + ", ".join(updates) + " WHERE id = :id"),
        params,
    )
    db.commit()
    row = db.execute(
        text("SELECT id, parent_id, name, sort_order FROM categories WHERE id = :id"),
        {"id": category_id},
    ).fetchone()
    return _row_to_item(row)


@router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: int,
    db=Depends(get_db),
    user=Depends(get_current_user),
):
    """카테고리 삭제 (관리자). 하위가 있으면 CASCADE. 글은 category_id SET NULL."""
    row = db.execute(text("SELECT 1 FROM categories WHERE id = :id"), {"id": category_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다.")
    db.execute(text("DELETE FROM categories WHERE id = :id"), {"id": category_id})
    db.commit()
    return None


@router.patch("/reorder")
def reorder_categories(
    body: ReorderBody,
    db=Depends(get_db),
    user=Depends(get_current_user),
):
    """카테고리 순서 변경 (관리자). order 배열 순서대로 sort_order 부여."""
    for i, item in enumerate(body.order):
        db.execute(
            text("UPDATE categories SET sort_order = :ord WHERE id = :id"),
            {"id": item.id, "ord": item.sort_order},
        )
    db.commit()
    return {"ok": True}
