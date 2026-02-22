"""경력 API."""
import logging
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy import text

logger = logging.getLogger(__name__)

from apps.api.core import get_db, UPLOAD_DIR
from apps.api.routers.auth import get_current_user

router = APIRouter(tags=["careers"])


def _relocate_temp_asset(asset_id: int | None, career_id: int, db, upload_dir: Path) -> None:
    """images/careers/temp/ 에 있는 asset을 images/careers/{career_id}/ 로 이동하고 assets.file_path 갱신."""
    if not asset_id:
        return
    row = db.execute(text("SELECT id, file_path FROM assets WHERE id = :id"), {"id": asset_id}).fetchone()
    if not row:
        return
    file_path = (row[1] or "").strip().replace("\\", "/")
    if not file_path.startswith("images/careers/temp/"):
        return
    src = upload_dir / file_path
    if not src.is_file():
        return
    filename = Path(file_path).name
    new_rel_path = f"images/careers/{career_id}/{filename}"
    dest = upload_dir / new_rel_path
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(src), str(dest))
    db.execute(text("UPDATE assets SET file_path = :path WHERE id = :id"), {"path": new_rel_path, "id": asset_id})


def _file_path_to_url(fp) -> str | None:
    """DB file_path를 /static/uploads/ URL로 변환."""
    if not fp:
        return None
    s = str(fp).replace("\\", "/")
    return f"/static/uploads/{s}" if s else None


@router.get("")
def list_careers(db=Depends(get_db)):
    """경력 목록 (sort_order 순). logo URL, career_links, career_highlights, career_tags 포함."""
    rows = db.execute(
        text("""
            SELECT c.id, c.logo_asset_id, c.company_name, c.role, c.start_date, c.end_date, c.description, c.sort_order,
                   a.file_path
            FROM careers c
            LEFT JOIN assets a ON a.id = c.logo_asset_id
            ORDER BY c.sort_order, c.id
        """)
    ).fetchall()
    items = []
    for r in rows:
        cid = r[0]
        link_rows = []
        highlight_rows = []
        tag_rows = []
        try:
            link_rows = db.execute(
                text("SELECT id, link_name, link_url, sort_order FROM career_links WHERE career_id = :id ORDER BY sort_order, id"),
                {"id": cid},
            ).fetchall()
        except Exception:
            pass
        try:
            highlight_rows = db.execute(
                text("SELECT id, content, sort_order FROM career_highlights WHERE career_id = :id ORDER BY sort_order, id"),
                {"id": cid},
            ).fetchall()
        except Exception:
            pass
        try:
            tag_rows = db.execute(
                text("SELECT t.id, t.name FROM career_tags ct JOIN tags t ON t.id = ct.tag_id WHERE ct.career_id = :id"),
                {"id": cid},
            ).fetchall()
        except Exception:
            pass
        logo_url = _file_path_to_url(r[8])
        items.append({
            "id": r[0],
            "logo_asset_id": r[1],
            "logo": logo_url,
            "company_name": r[2],
            "role": r[3],
            "start_date": r[4].isoformat() if r[4] else None,
            "end_date": r[5].isoformat() if r[5] else None,
            "description": r[6],
            "sort_order": r[7],
            "links": [{"id": x[0], "link_name": x[1], "link_url": x[2], "sort_order": x[3]} for x in link_rows],
            "highlights": [{"id": x[0], "content": x[1], "sort_order": x[2]} for x in highlight_rows],
            "tags": [{"id": x[0], "name": x[1]} for x in tag_rows],
        })
    return items


class CareerLinkItem(BaseModel):
    link_name: str
    link_url: str
    sort_order: int = 0


class CareerBody(BaseModel):
    logo_asset_id: int | None = None
    company_name: str = ""
    role: str = ""
    start_date: str | None = None
    end_date: str | None = None
    description: str | None = None
    sort_order: int = 0
    career_links: list[CareerLinkItem] = []
    career_highlights: list[str] = []
    career_tags: list[int] = []

    @field_validator("career_tags", mode="before")
    @classmethod
    def normalize_career_tags(cls, v):
        if not v:
            return []
        out = []
        for x in v:
            if isinstance(x, int) and x:
                out.append(x)
            elif isinstance(x, str) and str(x).strip().isdigit():
                out.append(int(x))
        return out


class ReorderBody(BaseModel):
    id_order: list[int]


def _parse_date(s: str | None) -> str | None:
    if not s or not str(s).strip():
        return None
    raw = str(s).strip()[:10]
    if len(raw) == 7 and raw[4] == "-":
        return raw + "-01"
    return raw


@router.post("", dependencies=[Depends(get_current_user)])
def create_career(body: CareerBody, db=Depends(get_db)):
    """경력 생성."""
    company_name = (body.company_name or "").strip()
    role = (body.role or "").strip()
    if not company_name:
        raise HTTPException(status_code=400, detail="회사명을 입력하세요.")
    if not role:
        raise HTTPException(status_code=400, detail="역할을 입력하세요.")
    start_date = _parse_date(body.start_date)
    if not start_date:
        raise HTTPException(status_code=400, detail="시작일을 입력하세요.")
    try:
        max_order = db.execute(text("SELECT COALESCE(MAX(sort_order), 0) FROM careers")).scalar() or 0
        sort_order = body.sort_order if body.sort_order is not None else max_order + 1
        db.execute(
            text("""
                INSERT INTO careers (logo_asset_id, company_name, role, start_date, end_date, description, sort_order)
                VALUES (:logo_asset_id, :company_name, :role, :start_date, :end_date, :description, :sort_order)
            """),
            {
                "logo_asset_id": body.logo_asset_id,
                "company_name": company_name,
                "role": role,
                "start_date": start_date,
                "end_date": _parse_date(body.end_date),
                "description": (body.description or "").strip() or None,
                "sort_order": sort_order,
            },
        )
        row = db.execute(text("SELECT LAST_INSERT_ID()")).fetchone()
        new_id = row[0] if row else None
        if not new_id:
            db.rollback()
            raise HTTPException(status_code=500, detail="경력 생성 실패")
        upload_dir = Path(UPLOAD_DIR)
        _relocate_temp_asset(body.logo_asset_id, new_id, db, upload_dir)
        for idx, link in enumerate((body.career_links or [])[:5]):
            if not (link.link_name and link.link_url):
                continue
            db.execute(
                text("INSERT INTO career_links (career_id, link_name, link_url, sort_order) VALUES (:cid, :name, :url, :ord)"),
                {"cid": new_id, "name": link.link_name.strip(), "url": link.link_url.strip(), "ord": link.sort_order if link.sort_order is not None else idx},
            )
        for idx, content in enumerate([h for h in (body.career_highlights or [])[:5] if (h and str(h).strip())]):
            db.execute(
                text("INSERT INTO career_highlights (career_id, content, sort_order) VALUES (:cid, :content, :ord)"),
                {"cid": new_id, "content": str(content).strip(), "ord": idx},
            )
        for tid in (body.career_tags or [])[:5]:
            if tid:
                db.execute(text("INSERT INTO career_tags (career_id, tag_id) VALUES (:cid, :tid)"), {"cid": new_id, "tid": tid})
        db.commit()
        return {"id": new_id}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.exception("POST /api/careers 실패: %s", e)
        err = str(e).lower()
        if "career_links" in err or "career_highlights" in err or "career_tags" in err or "doesn't exist" in err or "unknown table" in err:
            raise HTTPException(
                status_code=500,
                detail="경력 확장 테이블이 없습니다. API 서버를 재시작하면 자동으로 생성됩니다. 재시작 후 다시 시도하세요.",
            )
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{career_id}", dependencies=[Depends(get_current_user)])
def update_career(career_id: int, body: CareerBody, db=Depends(get_db)):
    """경력 수정."""
    row = db.execute(text("SELECT id FROM careers WHERE id = :id"), {"id": career_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="경력을 찾을 수 없습니다.")
    company_name = (body.company_name or "").strip()
    role = (body.role or "").strip()
    if not company_name:
        raise HTTPException(status_code=400, detail="회사명을 입력하세요.")
    if not role:
        raise HTTPException(status_code=400, detail="역할을 입력하세요.")
    start_date = _parse_date(body.start_date)
    if not start_date:
        raise HTTPException(status_code=400, detail="시작일을 입력하세요.")
    db.execute(
        text("""
            UPDATE careers SET
                logo_asset_id = :logo_asset_id, company_name = :company_name, role = :role,
                start_date = :start_date, end_date = :end_date, description = :description, sort_order = :sort_order
            WHERE id = :id
        """),
        {
            "id": career_id,
            "logo_asset_id": body.logo_asset_id,
            "company_name": company_name,
            "role": role,
            "start_date": start_date,
            "end_date": _parse_date(body.end_date),
            "description": (body.description or "").strip() or None,
            "sort_order": body.sort_order if body.sort_order is not None else 0,
        },
    )
    upload_dir = Path(UPLOAD_DIR)
    _relocate_temp_asset(body.logo_asset_id, career_id, db, upload_dir)
    try:
        db.execute(text("DELETE FROM career_links WHERE career_id = :id"), {"id": career_id})
        db.execute(text("DELETE FROM career_highlights WHERE career_id = :id"), {"id": career_id})
        db.execute(text("DELETE FROM career_tags WHERE career_id = :id"), {"id": career_id})
    except Exception:
        pass
    for idx, link in enumerate((body.career_links or [])[:5]):
        if not (link.link_name and link.link_url):
            continue
        db.execute(
            text("INSERT INTO career_links (career_id, link_name, link_url, sort_order) VALUES (:cid, :name, :url, :ord)"),
            {"cid": career_id, "name": link.link_name.strip(), "url": link.link_url.strip(), "ord": link.sort_order if link.sort_order is not None else idx},
        )
    for idx, content in enumerate([h for h in (body.career_highlights or [])[:5] if (h and str(h).strip())]):
        db.execute(
            text("INSERT INTO career_highlights (career_id, content, sort_order) VALUES (:cid, :content, :ord)"),
            {"cid": career_id, "content": str(content).strip(), "ord": idx},
        )
    for tid in (body.career_tags or [])[:5]:
        if tid:
            db.execute(text("INSERT INTO career_tags (career_id, tag_id) VALUES (:cid, :tid)"), {"cid": career_id, "tid": tid})
    db.commit()
    return {"id": career_id}


@router.delete("/{career_id}", dependencies=[Depends(get_current_user)])
def delete_career(career_id: int, db=Depends(get_db)):
    """경력 삭제."""
    row = db.execute(text("SELECT id FROM careers WHERE id = :id"), {"id": career_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="경력을 찾을 수 없습니다.")
    try:
        db.execute(text("DELETE FROM career_links WHERE career_id = :id"), {"id": career_id})
        db.execute(text("DELETE FROM career_highlights WHERE career_id = :id"), {"id": career_id})
        db.execute(text("DELETE FROM career_tags WHERE career_id = :id"), {"id": career_id})
    except Exception:
        pass
    db.execute(text("DELETE FROM careers WHERE id = :id"), {"id": career_id})
    db.commit()
    return {"ok": True}


@router.patch("/reorder", dependencies=[Depends(get_current_user)])
def reorder_careers(body: ReorderBody, db=Depends(get_db)):
    """경력 정렬 순서 변경."""
    for idx, cid in enumerate(body.id_order or []):
        if cid:
            db.execute(text("UPDATE careers SET sort_order = :ord WHERE id = :id"), {"ord": idx, "id": cid})
    db.commit()
    return {"ok": True}
