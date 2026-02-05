"""경력 API."""
from fastapi import APIRouter, Depends
from sqlalchemy import text

from apps.api.core import get_db

router = APIRouter(tags=["careers"])


@router.get("")
def list_careers(db=Depends(get_db)):
    """경력 목록 (sort_order 순)."""
    rows = db.execute(
        text("""
            SELECT id, logo_asset_id, company_name, role, start_date, end_date, description, sort_order
            FROM careers ORDER BY sort_order, id
        """)
    ).fetchall()
    return [
        {
            "id": r[0],
            "logo_asset_id": r[1],
            "company_name": r[2],
            "role": r[3],
            "start_date": r[4].isoformat() if r[4] else None,
            "end_date": r[5].isoformat() if r[5] else None,
            "description": r[6],
            "sort_order": r[7],
        }
        for r in rows
    ]
