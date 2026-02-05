"""카테고리 API."""
from fastapi import APIRouter, Depends
from sqlalchemy import text

from apps.api.core import get_db

router = APIRouter(tags=["categories"])


@router.get("")
def list_categories(db=Depends(get_db)):
    """카테고리 목록 (sort_order 순)."""
    rows = db.execute(
        text("SELECT id, name, slug, sort_order FROM categories ORDER BY sort_order, id")
    ).fetchall()
    return [{"id": r[0], "name": r[1], "slug": r[2], "sort_order": r[3]} for r in rows]
