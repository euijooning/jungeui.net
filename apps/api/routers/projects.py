"""프로젝트 API."""
import shutil
import traceback
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy import text

from apps.api.core import get_db, UPLOAD_DIR
from apps.api.routers.auth import get_current_user

router = APIRouter(tags=["projects"])


class ProjectLinkItem(BaseModel):
    link_name: str
    link_url: str
    sort_order: int = 0


class ProjectBody(BaseModel):
    title: str = ""
    description: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    thumbnail_asset_id: int | None = None
    intro_image_asset_id: int | None = None
    sort_order: int = 0
    project_links: list[ProjectLinkItem] = []
    project_tags: list[int] = []

    @field_validator("project_tags", mode="before")
    @classmethod
    def normalize_project_tags(cls, v):
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


def _file_path_to_url(fp) -> str | None:
    """DB file_path를 /static/uploads/ URL로 변환."""
    if not fp:
        return None
    s = str(fp).replace("\\", "/")
    return f"/static/uploads/{s}" if s else None


@router.get("")
def list_projects(db=Depends(get_db)):
    """프로젝트 목록 (sort_order 순). 링크·태그·썸네일 URL 포함."""
    try:
        rows = db.execute(
            text("""
                SELECT p.id, p.thumbnail_asset_id, p.intro_image_asset_id, p.title, p.description,
                       p.start_date, p.end_date, p.sort_order,
                       a.file_path, a2.file_path
                FROM projects p
                LEFT JOIN assets a ON a.id = p.thumbnail_asset_id
                LEFT JOIN assets a2 ON a2.id = p.intro_image_asset_id
                ORDER BY p.sort_order, p.id
            """)
        ).fetchall()
    except Exception as e:
        err = str(e).lower()
        if "intro_image_asset_id" in err or "unknown column" in err:
            raise HTTPException(
                status_code=500,
                detail="DB에 intro_image_asset_id 컬럼이 없습니다. python scripts/add_intro_image_to_projects.py 실행 후 다시 시도하세요.",
            )
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    items = []
    for r in rows:
        pid = r[0]
        link_rows = db.execute(
            text("SELECT id, link_name, link_url, sort_order FROM project_links WHERE project_id = :id ORDER BY sort_order, id"),
            {"id": pid},
        ).fetchall()
        tag_rows = db.execute(
            text("""
                SELECT t.id, t.name
                FROM project_tags pt
                JOIN tags t ON t.id = pt.tag_id
                WHERE pt.project_id = :id
                ORDER BY pt.sort_order ASC, pt.tag_id ASC
            """),
            {"id": pid},
        ).fetchall()
        thumb_path = _file_path_to_url(r[8])
        intro_path = _file_path_to_url(r[9])
        items.append({
            "id": r[0],
            "thumbnail_asset_id": r[1],
            "thumbnail": thumb_path,
            "intro_image_asset_id": r[2],
            "intro_image": intro_path,
            "title": r[3],
            "description": r[4],
            "start_date": r[5].isoformat() if r[5] else None,
            "end_date": r[6].isoformat() if r[6] else None,
            "sort_order": r[7],
            "links": [{"id": x[0], "link_name": x[1], "link_url": x[2], "sort_order": x[3]} for x in link_rows],
            "tags": [{"id": x[0], "name": x[1]} for x in tag_rows],
        })
    return items


def _parse_date(s: str | None) -> str | None:
    if not s or not str(s).strip():
        return None
    raw = str(s).strip()[:10]
    # YYYY-MM(7자) → YYYY-MM-01
    if len(raw) == 7 and raw[4] == "-":
        return raw + "-01"
    return raw


def _relocate_temp_asset(asset_id: int | None, project_id: int, db, upload_dir: Path) -> None:
    """images/projects/temp/ 에 있는 asset을 images/projects/{project_id}/ 로 이동하고 assets.file_path 갱신."""
    if not asset_id:
        return
    row = db.execute(text("SELECT id, file_path FROM assets WHERE id = :id"), {"id": asset_id}).fetchone()
    if not row:
        return
    file_path = (row[1] or "").strip().replace("\\", "/")
    if not file_path.startswith("images/projects/temp/"):
        return
    src = upload_dir / file_path
    if not src.is_file():
        return
    filename = Path(file_path).name
    new_rel_path = f"images/projects/{project_id}/{filename}"
    dest = upload_dir / new_rel_path
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(src), str(dest))
    db.execute(text("UPDATE assets SET file_path = :path WHERE id = :id"), {"path": new_rel_path, "id": asset_id})


@router.post("", dependencies=[Depends(get_current_user)])
def create_project(body: ProjectBody, db=Depends(get_db)):
    """프로젝트 생성."""
    try:
        return _create_project_impl(body, db)
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


def _create_project_impl(body: ProjectBody, db):
    title = (body.title or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="프로젝트명을 입력하세요.")
    try:
        max_order = db.execute(text("SELECT COALESCE(MAX(sort_order), 0) FROM projects")).scalar() or 0
        sort_order = body.sort_order if body.sort_order is not None else max_order + 1
        db.execute(
            text("""
                INSERT INTO projects (title, description, start_date, end_date, thumbnail_asset_id, intro_image_asset_id, sort_order)
                VALUES (:title, :description, :start_date, :end_date, :thumbnail_asset_id, :intro_image_asset_id, :sort_order)
            """),
            {
                "title": title,
                "description": (body.description or "").strip() or None,
                "start_date": _parse_date(body.start_date),
                "end_date": _parse_date(body.end_date),
                "thumbnail_asset_id": body.thumbnail_asset_id,
                "intro_image_asset_id": body.intro_image_asset_id,
                "sort_order": sort_order,
            },
        )
        row = db.execute(text("SELECT LAST_INSERT_ID()")).fetchone()
        new_id = row[0] if row else None
        if not new_id:
            db.rollback()
            raise HTTPException(status_code=500, detail="프로젝트 생성 실패")
        upload_dir = Path(UPLOAD_DIR)
        _relocate_temp_asset(body.thumbnail_asset_id, new_id, db, upload_dir)
        _relocate_temp_asset(body.intro_image_asset_id, new_id, db, upload_dir)
        for idx, link in enumerate(body.project_links or []):
            if not (link.link_name and link.link_url):
                continue
            db.execute(
                text("INSERT INTO project_links (project_id, link_name, link_url, sort_order) VALUES (:pid, :name, :url, :ord)"),
                {"pid": new_id, "name": link.link_name.strip(), "url": link.link_url.strip(), "ord": link.sort_order if link.sort_order is not None else idx},
            )
        for index, tid in enumerate(body.project_tags or []):
            if tid:
                db.execute(
                    text("INSERT INTO project_tags (project_id, tag_id, sort_order) VALUES (:pid, :tid, :ord)"),
                    {"pid": new_id, "tid": tid, "ord": index},
                )
        db.commit()
        return {"id": new_id}
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


@router.put("/{project_id}", dependencies=[Depends(get_current_user)])
def update_project(project_id: int, body: ProjectBody, db=Depends(get_db)):
    """프로젝트 수정."""
    row = db.execute(text("SELECT id FROM projects WHERE id = :id"), {"id": project_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")
    title = (body.title or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="프로젝트명을 입력하세요.")
    db.execute(
        text("""
            UPDATE projects SET
                title = :title, description = :description,
                start_date = :start_date, end_date = :end_date,
                thumbnail_asset_id = :thumbnail_asset_id, intro_image_asset_id = :intro_image_asset_id, sort_order = :sort_order
            WHERE id = :id
        """),
        {
            "id": project_id,
            "title": title,
            "description": (body.description or "").strip() or None,
            "start_date": _parse_date(body.start_date),
            "end_date": _parse_date(body.end_date),
            "thumbnail_asset_id": body.thumbnail_asset_id,
            "intro_image_asset_id": body.intro_image_asset_id,
            "sort_order": body.sort_order if body.sort_order is not None else 0,
        },
    )
    db.execute(text("DELETE FROM project_links WHERE project_id = :id"), {"id": project_id})
    db.execute(text("DELETE FROM project_tags WHERE project_id = :id"), {"id": project_id})
    for idx, link in enumerate(body.project_links or []):
        if not (link.link_name and link.link_url):
            continue
        db.execute(
            text("INSERT INTO project_links (project_id, link_name, link_url, sort_order) VALUES (:pid, :name, :url, :ord)"),
            {"pid": project_id, "name": link.link_name.strip(), "url": link.link_url.strip(), "ord": link.sort_order if link.sort_order is not None else idx},
        )
    for index, tid in enumerate(body.project_tags or []):
        if tid:
            db.execute(
                text("INSERT INTO project_tags (project_id, tag_id, sort_order) VALUES (:pid, :tid, :ord)"),
                {"pid": project_id, "tid": tid, "ord": index},
            )
    upload_dir = Path(UPLOAD_DIR)
    _relocate_temp_asset(body.thumbnail_asset_id, project_id, db, upload_dir)
    _relocate_temp_asset(body.intro_image_asset_id, project_id, db, upload_dir)
    db.commit()
    return {"id": project_id}


@router.delete("/{project_id}", dependencies=[Depends(get_current_user)])
def delete_project(project_id: int, db=Depends(get_db)):
    """프로젝트 삭제."""
    row = db.execute(text("SELECT id FROM projects WHERE id = :id"), {"id": project_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")
    db.execute(text("DELETE FROM project_links WHERE project_id = :id"), {"id": project_id})
    db.execute(text("DELETE FROM project_tags WHERE project_id = :id"), {"id": project_id})
    db.execute(text("DELETE FROM projects WHERE id = :id"), {"id": project_id})
    db.commit()
    return {"ok": True}


@router.patch("/reorder", dependencies=[Depends(get_current_user)])
def reorder_projects(body: ReorderBody, db=Depends(get_db)):
    """프로젝트 정렬 순서 변경."""
    for idx, pid in enumerate(body.id_order or []):
        if pid:
            db.execute(text("UPDATE projects SET sort_order = :ord WHERE id = :id"), {"ord": idx, "id": pid})
    db.commit()
    return {"ok": True}
