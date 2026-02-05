"""프로젝트 API."""
from fastapi import APIRouter, Depends
from sqlalchemy import text

from apps.api.core import get_db

router = APIRouter(tags=["projects"])


@router.get("")
def list_projects(db=Depends(get_db)):
    """프로젝트 목록 (sort_order 순). 링크·태그 포함."""
    rows = db.execute(
        text("""
            SELECT id, thumbnail_asset_id, title, subtitle, description, start_date, end_date, sort_order
            FROM projects ORDER BY sort_order, id
        """)
    ).fetchall()
    items = []
    for r in rows:
        pid = r[0]
        link_rows = db.execute(
            text("SELECT id, link_name, link_url, sort_order FROM project_links WHERE project_id = :id ORDER BY sort_order, id"),
            {"id": pid},
        ).fetchall()
        tag_rows = db.execute(
            text("SELECT t.id, t.name FROM project_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.project_id = :id"),
            {"id": pid},
        ).fetchall()
        items.append({
            "id": r[0],
            "thumbnail_asset_id": r[1],
            "title": r[2],
            "subtitle": r[3],
            "description": r[4],
            "start_date": r[5].isoformat() if r[5] else None,
            "end_date": r[6].isoformat() if r[6] else None,
            "sort_order": r[7],
            "links": [{"id": x[0], "link_name": x[1], "link_url": x[2], "sort_order": x[3]} for x in link_rows],
            "tags": [{"id": x[0], "name": x[1]} for x in tag_rows],
        })
    return items
