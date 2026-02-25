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
    logo_asset_id: int | None = None
    sort_order: int = 0
    notion_url: str | None = None
    is_pinned: bool = False
    project_links: list[ProjectLinkItem] = []
    project_tag_names: list[str] = []

    @field_validator("project_tag_names", mode="before")
    @classmethod
    def normalize_project_tag_names(cls, v):
        if not v:
            return []
        out = []
        for x in v:
            s = (x if isinstance(x, str) else str(x)).strip()[:50]
            if s:
                out.append(s)
        return out[:7]


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
                       p.start_date, p.end_date, p.sort_order, p.notion_url, p.is_pinned, p.logo_asset_id,
                       a.file_path, a2.file_path, a3.file_path
                FROM projects p
                LEFT JOIN assets a ON a.id = p.thumbnail_asset_id
                LEFT JOIN assets a2 ON a2.id = p.intro_image_asset_id
                LEFT JOIN assets a3 ON a3.id = p.logo_asset_id
                ORDER BY p.sort_order, p.id
            """)
        ).fetchall()
    except Exception as e:
        err = str(e).lower()
        if "unknown column" in err and ("notion_url" in err or "logo_asset_id" in err):
            raise HTTPException(
                status_code=500,
                detail="DB에 notion_url/is_pinned/logo_asset_id 컬럼이 없습니다. python scripts/add_projects_notion_pinned_logo.py 실행 후 다시 시도하세요.",
            )
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
        try:
            tag_rows = db.execute(
                text("SELECT name, sort_order FROM project_tag_labels WHERE project_id = :id ORDER BY sort_order"),
                {"id": pid},
            ).fetchall()
        except Exception:
            tag_rows = []
        tag_list = [{"name": x[0]} for x in tag_rows]
        thumb_path = _file_path_to_url(r[11])
        intro_path = _file_path_to_url(r[12])
        logo_path = _file_path_to_url(r[13]) if len(r) > 13 else None
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
            "notion_url": r[8] if len(r) > 8 else None,
            "is_pinned": bool(r[9]) if len(r) > 9 else False,
            "logo_asset_id": r[10] if len(r) > 10 else None,
            "logo": logo_path,
            "links": [{"id": x[0], "link_name": x[1], "link_url": x[2], "sort_order": x[3]} for x in link_rows],
            "tags": tag_list,
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


def _validate_start_end_dates(start_date: str | None, end_date: str | None) -> None:
    """둘 다 있을 때 종료일이 시작일보다 과거면 HTTPException."""
    if not start_date or not end_date:
        return
    if end_date < start_date:
        raise HTTPException(status_code=400, detail="종료일은 시작일보다 과거일 수 없습니다.")


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
    if len(title) > 20:
        raise HTTPException(status_code=400, detail="프로젝트명은 20자 이하여야 합니다.")
    desc = (body.description or "").strip() or None
    if desc and len(desc) > 20:
        raise HTTPException(status_code=400, detail="한 줄 설명은 20자 이하여야 합니다.")
    notion_url = (body.notion_url or "").strip() or None
    start_parsed = _parse_date(body.start_date)
    end_parsed = _parse_date(body.end_date)
    _validate_start_end_dates(start_parsed, end_parsed)
    try:
        max_order = db.execute(text("SELECT COALESCE(MAX(sort_order), 0) FROM projects")).scalar() or 0
        sort_order = body.sort_order if body.sort_order is not None else max_order + 1
        db.execute(
            text("""
                INSERT INTO projects (title, description, start_date, end_date, thumbnail_asset_id, intro_image_asset_id, logo_asset_id, sort_order, notion_url, is_pinned)
                VALUES (:title, :description, :start_date, :end_date, :thumbnail_asset_id, :intro_image_asset_id, :logo_asset_id, :sort_order, :notion_url, :is_pinned)
            """),
            {
                "title": title,
                "description": desc,
                "start_date": start_parsed,
                "end_date": end_parsed,
                "thumbnail_asset_id": body.thumbnail_asset_id,
                "intro_image_asset_id": body.intro_image_asset_id,
                "logo_asset_id": body.logo_asset_id,
                "sort_order": sort_order,
                "notion_url": notion_url,
                "is_pinned": 1 if body.is_pinned else 0,
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
        _relocate_temp_asset(body.logo_asset_id, new_id, db, upload_dir)
        for idx, link in enumerate(body.project_links or []):
            if not (link.link_name and link.link_url):
                continue
            db.execute(
                text("INSERT INTO project_links (project_id, link_name, link_url, sort_order) VALUES (:pid, :name, :url, :ord)"),
                {"pid": new_id, "name": link.link_name.strip(), "url": link.link_url.strip(), "ord": link.sort_order if link.sort_order is not None else idx},
            )
        for index, name in enumerate(body.project_tag_names or []):
            if name:
                db.execute(
                    text("INSERT INTO project_tag_labels (project_id, sort_order, name) VALUES (:pid, :ord, :name)"),
                    {"pid": new_id, "ord": index, "name": name},
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
    if len(title) > 20:
        raise HTTPException(status_code=400, detail="프로젝트명은 20자 이하여야 합니다.")
    desc = (body.description or "").strip() or None
    if desc and len(desc) > 20:
        raise HTTPException(status_code=400, detail="한 줄 설명은 20자 이하여야 합니다.")
    notion_url = (body.notion_url or "").strip() or None
    start_parsed = _parse_date(body.start_date)
    end_parsed = _parse_date(body.end_date)
    _validate_start_end_dates(start_parsed, end_parsed)
    db.execute(
        text("""
            UPDATE projects SET
                title = :title, description = :description,
                start_date = :start_date, end_date = :end_date,
                thumbnail_asset_id = :thumbnail_asset_id, intro_image_asset_id = :intro_image_asset_id,
                logo_asset_id = :logo_asset_id, sort_order = :sort_order, notion_url = :notion_url, is_pinned = :is_pinned
            WHERE id = :id
        """),
        {
            "id": project_id,
            "title": title,
            "description": desc,
            "start_date": start_parsed,
            "end_date": end_parsed,
            "thumbnail_asset_id": body.thumbnail_asset_id,
            "intro_image_asset_id": body.intro_image_asset_id,
            "logo_asset_id": body.logo_asset_id,
            "sort_order": body.sort_order if body.sort_order is not None else 0,
            "notion_url": notion_url,
            "is_pinned": 1 if body.is_pinned else 0,
        },
    )
    db.execute(text("DELETE FROM project_links WHERE project_id = :id"), {"id": project_id})
    try:
        db.execute(text("DELETE FROM project_tag_labels WHERE project_id = :id"), {"id": project_id})
    except Exception:
        pass
    for idx, link in enumerate(body.project_links or []):
        if not (link.link_name and link.link_url):
            continue
        db.execute(
            text("INSERT INTO project_links (project_id, link_name, link_url, sort_order) VALUES (:pid, :name, :url, :ord)"),
            {"pid": project_id, "name": link.link_name.strip(), "url": link.link_url.strip(), "ord": link.sort_order if link.sort_order is not None else idx},
        )
    for index, name in enumerate(body.project_tag_names or []):
        if name:
            db.execute(
                text("INSERT INTO project_tag_labels (project_id, sort_order, name) VALUES (:pid, :ord, :name)"),
                {"pid": project_id, "ord": index, "name": name},
            )
    upload_dir = Path(UPLOAD_DIR)
    _relocate_temp_asset(body.thumbnail_asset_id, project_id, db, upload_dir)
    _relocate_temp_asset(body.intro_image_asset_id, project_id, db, upload_dir)
    _relocate_temp_asset(body.logo_asset_id, project_id, db, upload_dir)
    db.commit()
    return {"id": project_id}


@router.delete("/{project_id}", dependencies=[Depends(get_current_user)])
def delete_project(project_id: int, db=Depends(get_db)):
    """프로젝트 삭제."""
    row = db.execute(text("SELECT id FROM projects WHERE id = :id"), {"id": project_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")
    db.execute(text("DELETE FROM project_links WHERE project_id = :id"), {"id": project_id})
    try:
        db.execute(text("DELETE FROM project_tag_labels WHERE project_id = :id"), {"id": project_id})
    except Exception:
        pass
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
