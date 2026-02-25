"""게시글 API."""
import logging
import shutil
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, ProgrammingError, SQLAlchemyError

from apps.api.core import get_db, UPLOAD_DIR
from apps.api.core.config import get_today_iso
from apps.api.routers.auth import get_optional_user

router = APIRouter(tags=["posts"])
logger = logging.getLogger(__name__)


class PostBody(BaseModel):
    title: str = ""
    slug: str = ""
    status: str = "DRAFT"
    published_at: str | None = None
    category_id: int | None = None
    prefix_id: int | None = None
    thumbnail_asset_id: int | None = None
    content_html: str | None = None
    content_json: str | None = None
    post_tags: list[int] = []
    attachment_asset_ids: list[int] = []


def _relocate_post_temp_asset(asset_id: int | None, post_id: int, db, upload_dir: Path) -> None:
    """images/posts/.../temp/ 에 있는 asset을 .../post_id/ 로 이동하고 assets.file_path 갱신."""
    if not asset_id:
        return
    row = db.execute(text("SELECT id, file_path FROM assets WHERE id = :id"), {"id": asset_id}).fetchone()
    if not row:
        return
    file_path = (row[1] or "").strip().replace("\\", "/")
    if "/temp/" not in file_path:
        return
    src = upload_dir / file_path
    if not src.is_file():
        return
    new_rel_path = file_path.replace("/temp/", f"/{post_id}/", 1)
    dest = upload_dir / new_rel_path
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(src), str(dest))
    db.execute(text("UPDATE assets SET file_path = :path WHERE id = :id"), {"path": new_rel_path, "id": asset_id})


def _relocate_post_content_temp_assets(post_id: int, content_html: str | None, db, upload_dir: Path) -> None:
    """본문 content_html에 URL로 참조된 images/posts/.../temp/ asset들을 post_id 폴더로 이동."""
    if not content_html:
        return
    content_norm = content_html.replace("\\", "/")
    rows = db.execute(
        text("SELECT id, file_path FROM assets WHERE file_path LIKE :pat AND file_path LIKE :temp"),
        {"pat": "images/posts/%", "temp": "%/temp/%"},
    ).fetchall()
    for row in rows:
        aid, fp = row[0], (row[1] or "").strip().replace("\\", "/")
        url_rel = f"/static/uploads/{fp}"
        # 본문에 상대 URL 또는 절대 URL(호스트 포함)로 들어있을 수 있음
        if url_rel in content_norm or fp in content_norm:
            _relocate_post_temp_asset(aid, post_id, db, upload_dir)


def _slug_exists(db, slug: str, exclude_id: int | None = None) -> bool:
    if exclude_id is not None:
        r = db.execute(
            text("SELECT 1 FROM posts WHERE slug = :slug AND id != :id"),
            {"slug": slug, "id": exclude_id},
        ).fetchone()
    else:
        r = db.execute(text("SELECT 1 FROM posts WHERE slug = :slug"), {"slug": slug}).fetchone()
    return r is not None


def _unique_slug(db, base: str, exclude_id: int | None = None) -> str:
    slug = base or "untitled"
    if not _slug_exists(db, slug, exclude_id):
        return slug
    n = 1
    while _slug_exists(db, f"{slug}-{n}", exclude_id):
        n += 1
    return f"{slug}-{n}"


def _parse_published_at(s: str | None) -> datetime | None:
    """Parse published_at string to datetime (naive UTC for DB/comparison).
    Frontend sends ISO 8601 with Z; legacy naive input is treated as UTC."""
    if not s or not str(s).strip():
        return None
    s = str(s).strip()
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        if dt.tzinfo:
            dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
        else:
            dt = dt.replace(tzinfo=timezone.utc).astimezone(timezone.utc).replace(tzinfo=None)
        return dt
    except (ValueError, TypeError):
        return None


def _published_at_in_past(parsed: datetime | None) -> bool:
    """True면 '과거'로 간주해 400. 즉시공개 시 클라이언트 시계가 서버보다 느릴 수 있으므로 60초 허용."""
    if not parsed:
        return False
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    return parsed < (now - timedelta(seconds=60))


def _isoformat_utc(dt: datetime | None) -> str | None:
    """Naive datetime은 UTC로 간주하고, ISO 8601 문자열로 반환 (끝에 Z)."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


@router.get("")
def list_posts(
    page: int = 1,
    per_page: int = 10,
    category_id: int | None = None,
    tag_id: int | None = None,
    prefix_id: int | None = None,
    status: str | None = None,
    q: str | None = None,
    order_by: str | None = None,
    db=Depends(get_db),
):
    """글 목록 (페이지네이션)."""
    offset = (page - 1) * per_page
    filter_params = {}
    where = []
    if category_id is not None:
        # 대카테고리 선택 시 해당 대+하위(소) 카테고리 글 모두 포함
        where.append(
            "p.category_id IN (SELECT id FROM categories WHERE id = :category_id OR parent_id = :category_id)"
        )
        filter_params["category_id"] = category_id
    if status:
        where.append("p.status = :status")
        filter_params["status"] = status
        if status == "PUBLISHED":
            where.append("(p.published_at IS NOT NULL AND p.published_at <= UTC_TIMESTAMP())")
    if tag_id is not None:
        where.append("EXISTS (SELECT 1 FROM post_tags pt WHERE pt.post_id = p.id AND pt.tag_id = :tag_id)")
        filter_params["tag_id"] = tag_id
    if prefix_id is not None:
        where.append("p.prefix_id = :prefix_id")
        filter_params["prefix_id"] = prefix_id
    if q and q.strip():
        where.append("p.title LIKE :q")
        filter_params["q"] = f"%{q.strip()}%"
    where_sql = " AND ".join(where) if where else "1=1"
    count_row = db.execute(
        text(f"SELECT COUNT(*) FROM posts p WHERE {where_sql}"),
        filter_params,
    ).fetchone()
    total = count_row[0] or 0
    if order_by == "oldest":
        order_sql = "ORDER BY p.id ASC"
    elif order_by == "views":
        order_sql = "ORDER BY COALESCE(p.view_count, 0) DESC, p.id DESC"
    else:
        # 공개/일부공개/비공개 구분 없이 글 생성 순서(id)대로 정렬
        order_sql = "ORDER BY p.id DESC"
    rows = db.execute(
        text(f"""
            SELECT p.id, p.title, p.slug, p.status, p.published_at, p.created_at, p.updated_at,
                   p.category_id, c.name AS category_name, COALESCE(p.view_count, 0) AS view_count
            FROM posts p
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE {where_sql}
            {order_sql}
            LIMIT :limit OFFSET :offset
        """),
        {**filter_params, "limit": per_page, "offset": offset},
    ).fetchall()
    items = []
    for r in rows:
        items.append({
            "id": r[0],
            "title": r[1],
            "slug": r[2],
            "status": r[3],
            "published_at": _isoformat_utc(r[4]),
            "created_at": _isoformat_utc(r[5]),
            "updated_at": _isoformat_utc(r[6]),
            "category_id": r[7],
            "category_name": r[8],
            "category": {"id": r[7], "name": r[8]} if r[7] else None,
            "view_count": int(r[9]) if r[9] is not None else 0,
        })
    return {"items": items, "total": total}


@router.get("/{post_id}/neighbors")
def get_post_neighbors(post_id: int, db=Depends(get_db)):
    """이전/다음 글 (published_at 기준, PUBLISHED만). prev=이전에 쓴 글(오래된), next=다음에 쓴 글(최신)."""
    cur = db.execute(
        text("""
            SELECT id, published_at FROM posts
            WHERE id = :id AND status = 'PUBLISHED'
            AND published_at IS NOT NULL AND published_at <= UTC_TIMESTAMP()
        """),
        {"id": post_id},
    ).fetchone()
    if not cur:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다.")
    pub_at = cur[1]
    # 목록에서 위 = 더 최신 글 (published_at, id) > current → 응답에서는 next
    prev_row = db.execute(
        text("""
            SELECT p.id, p.title FROM posts p
            WHERE p.status = 'PUBLISHED' AND p.published_at IS NOT NULL AND p.published_at <= UTC_TIMESTAMP() AND p.id != :id
            AND (COALESCE(p.published_at, '1970-01-01') > COALESCE(:pub_at, '1970-01-01')
                 OR (COALESCE(p.published_at, '1970-01-01') = COALESCE(:pub_at, '1970-01-01') AND p.id > :id))
            ORDER BY COALESCE(p.published_at, '1970-01-01') ASC, p.id ASC
            LIMIT 1
        """),
        {"id": post_id, "pub_at": pub_at},
    ).fetchone()
    # 목록에서 아래 = 더 오래된 글 → 응답에서는 prev
    next_row = db.execute(
        text("""
            SELECT p.id, p.title FROM posts p
            WHERE p.status = 'PUBLISHED' AND p.published_at IS NOT NULL AND p.published_at <= UTC_TIMESTAMP() AND p.id != :id
            AND (COALESCE(p.published_at, '1970-01-01') < COALESCE(:pub_at, '1970-01-01')
                 OR (COALESCE(p.published_at, '1970-01-01') = COALESCE(:pub_at, '1970-01-01') AND p.id < :id))
            ORDER BY COALESCE(p.published_at, '1970-01-01') DESC, p.id DESC
            LIMIT 1
        """),
        {"id": post_id, "pub_at": pub_at},
    ).fetchone()
    return {
        "prev": {"id": next_row[0], "title": next_row[1]} if next_row else None,  # 이전에 쓴 글(오래된)
        "next": {"id": prev_row[0], "title": prev_row[1]} if prev_row else None,  # 다음에 쓴 글(최신)
    }


@router.get("/{post_id}")
def get_post(post_id: int, db=Depends(get_db), current_user=Depends(get_optional_user)):
    """글 단건 조회. 비로그인 시 PUBLISHED만, 로그인 시 전체."""
    row = db.execute(
        text("""
            SELECT p.id, p.title, p.slug, p.status, p.published_at, p.category_id, p.prefix_id, p.thumbnail_asset_id,
                   p.content_html, p.content_json, p.created_at, p.updated_at,
                   c.name AS category_name, pp.name AS prefix_name, COALESCE(p.view_count, 0) AS view_count
            FROM posts p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN post_prefixes pp ON pp.id = p.prefix_id
            WHERE p.id = :id
        """),
        {"id": post_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다.")
    (pid, title, slug, status, published_at, category_id, prefix_id, thumbnail_asset_id,
     content_html, content_json, created_at, updated_at, category_name, prefix_name, view_count) = row
    if not current_user and status != "PUBLISHED":
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다.")
    if not current_user and status == "PUBLISHED":
        ok = db.execute(
            text("SELECT 1 FROM posts WHERE id = :id AND published_at IS NOT NULL AND published_at <= UTC_TIMESTAMP()"),
            {"id": post_id},
        ).fetchone()
        if not ok:
            raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다.")

    # 퍼블릭 조회 시 daily_stats 집계 및 해당 글 view_count 증가 (비로그인 + PUBLISHED만). 실패해도 글 조회는 정상 반환.
    if current_user is None and status == "PUBLISHED":
        try:
            today = get_today_iso()
            db.execute(
                text("""
                    INSERT INTO daily_stats (date, total_views, visitor_count)
                    VALUES (:dt, 1, 1)
                    ON DUPLICATE KEY UPDATE
                        total_views = total_views + 1,
                        visitor_count = visitor_count + 1
                """),
                {"dt": today},
            )
            db.execute(
                text("UPDATE posts SET view_count = COALESCE(view_count, 0) + 1 WHERE id = :id"),
                {"id": post_id},
            )
            db.commit()
        except (OperationalError, ProgrammingError, SQLAlchemyError) as e:
            logger.warning("daily_stats/view_count 갱신 실패: %s", e)

    tag_rows = db.execute(
        text("SELECT t.id, t.name FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = :id"),
        {"id": post_id},
    ).fetchall()
    try:
        att_rows = db.execute(
            text("""
                SELECT a.id, a.original_name, a.file_path, a.size_bytes
                FROM post_attachments pa
                JOIN assets a ON a.id = pa.asset_id
                WHERE pa.post_id = :id
                ORDER BY pa.sort_order, pa.asset_id
            """),
            {"id": post_id},
        ).fetchall()
    except (OperationalError, ProgrammingError, SQLAlchemyError):
        # post_attachments 테이블 없음/조회 실패 시 빈 목록으로 응답 유지 (500 방지)
        att_rows = []
    attachments = []
    for a in att_rows:
        url = f"/static/uploads/{a[2].replace(chr(92), '/')}" if a[2] else None
        attachments.append({
            "id": a[0],
            "original_name": a[1],
            "url": url,
            "size_bytes": a[3],
        })
    return {
        "id": pid,
        "title": title,
        "slug": slug,
        "status": status,
        "published_at": _isoformat_utc(published_at),
        "category_id": category_id,
        "prefix_id": prefix_id,
        "prefix_name": prefix_name,
        "thumbnail_asset_id": thumbnail_asset_id,
        "content_html": content_html,
        "content_json": content_json,
        "created_at": _isoformat_utc(created_at),
        "updated_at": _isoformat_utc(updated_at),
        "category_name": category_name,
        "view_count": int(view_count) if view_count is not None else 0,
        "post_tags": [r[0] for r in tag_rows],
        "tags": [{"id": r[0], "name": r[1]} for r in tag_rows],
        "attachments": attachments,
    }


@router.post("")
def create_post(body: PostBody, db=Depends(get_db)):
    """글 생성."""
    slug = _unique_slug(db, (body.slug or "").strip() or "untitled")
    published = body.published_at if body.published_at else None
    parsed = _parse_published_at(published) if published else None
    if published and parsed and _published_at_in_past(parsed):
        raise HTTPException(
            status_code=400,
            detail="발행일은 현재 시각 이전으로 설정할 수 없습니다.",
        )
    store_published = parsed if parsed else (published if published else None)
    db.execute(
        text("""
            INSERT INTO posts (title, slug, status, published_at, category_id, prefix_id, thumbnail_asset_id, content_html, content_json, created_at, updated_at)
            VALUES (:title, :slug, :status, :published_at, :category_id, :prefix_id, :thumbnail_asset_id, :content_html, :content_json, UTC_TIMESTAMP(), UTC_TIMESTAMP())
        """),
        {
            "title": (body.title or "제목 없음").strip(),
            "slug": slug,
            "status": body.status or "DRAFT",
            "published_at": store_published,
            "category_id": body.category_id,
            "prefix_id": body.prefix_id,
            "thumbnail_asset_id": body.thumbnail_asset_id,
            "content_html": body.content_html,
            "content_json": body.content_json,
        },
    )
    new_id_row = db.execute(text("SELECT LAST_INSERT_ID()")).fetchone()
    new_id = new_id_row[0] if new_id_row else None
    if new_id and body.post_tags:
        for tid in body.post_tags:
            if not tid:
                continue
            db.execute(
                text("INSERT INTO post_tags (post_id, tag_id) VALUES (:pid, :tid)"),
                {"pid": new_id, "tid": tid},
            )
    if new_id and body.attachment_asset_ids:
        for idx, aid in enumerate(body.attachment_asset_ids):
            if not aid:
                continue
            db.execute(
                text("INSERT INTO post_attachments (post_id, asset_id, sort_order) VALUES (:pid, :aid, :ord)"),
                {"pid": new_id, "aid": aid, "ord": idx},
            )
    if new_id:
        upload_dir = Path(UPLOAD_DIR)
        _relocate_post_temp_asset(body.thumbnail_asset_id, new_id, db, upload_dir)
        for aid in body.attachment_asset_ids or []:
            if aid:
                _relocate_post_temp_asset(aid, new_id, db, upload_dir)
        _relocate_post_content_temp_assets(new_id, body.content_html, db, upload_dir)
        # 본문 내 이미지 URL도 temp → 게시물ID로 갱신
        db.execute(
            text("UPDATE posts SET content_html = REPLACE(content_html, '/temp/', :pid_slash), content_json = REPLACE(COALESCE(content_json, ''), '/temp/', :pid_slash) WHERE id = :id"),
            {"pid_slash": f"/{new_id}/", "id": new_id},
        )
    db.commit()
    return {"id": new_id, "slug": slug}


@router.put("/{post_id}")
def update_post(post_id: int, body: PostBody, db=Depends(get_db)):
    """글 수정."""
    cur = db.execute(text("SELECT id, published_at FROM posts WHERE id = :id"), {"id": post_id}).fetchone()
    if not cur:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다.")
    existing_published_at = cur[1]  # datetime or None from DB
    slug = _unique_slug(db, (body.slug or "").strip() or "untitled", exclude_id=post_id)
    published = body.published_at if body.published_at else None
    parsed = _parse_published_at(published) if published else None
    if published and parsed and _published_at_in_past(parsed):
        existing_str = existing_published_at.isoformat()[:19] if existing_published_at else None
        body_str = parsed.isoformat()[:19] if parsed else None
        # 프론트엔드에서 toLocalISOString이 .slice(0,16)으로 초 단위를 절삭해 보내므로,
        # 분 단위(앞 16자리)까지만 비교해 실제 날짜/시간 변경이 아닌 경우 에러를 내지 않음.
        old_val = existing_str[:16] if existing_str else ""
        new_val = body_str[:16] if body_str else ""
        if new_val != old_val:
            raise HTTPException(
                status_code=400,
                detail="발행일은 현재 시각 이전으로 설정할 수 없습니다.",
            )
    store_published = parsed if parsed else (published if published else None)
    db.execute(
        text("""
            UPDATE posts SET title = :title, slug = :slug, status = :status, published_at = :published_at,
                   category_id = :category_id, prefix_id = :prefix_id, thumbnail_asset_id = :thumbnail_asset_id,
                   content_html = :content_html, content_json = :content_json, updated_at = UTC_TIMESTAMP()
            WHERE id = :id
        """),
        {
            "id": post_id,
            "title": (body.title or "제목 없음").strip(),
            "slug": slug,
            "status": body.status or "DRAFT",
            "published_at": store_published,
            "category_id": body.category_id,
            "prefix_id": body.prefix_id,
            "thumbnail_asset_id": body.thumbnail_asset_id,
            "content_html": body.content_html,
            "content_json": body.content_json,
        },
    )
    db.execute(text("DELETE FROM post_tags WHERE post_id = :id"), {"id": post_id})
    if body.post_tags:
        for tid in body.post_tags:
            if not tid:
                continue
            db.execute(
                text("INSERT INTO post_tags (post_id, tag_id) VALUES (:pid, :tid)"),
                {"pid": post_id, "tid": tid},
            )
    db.execute(text("DELETE FROM post_attachments WHERE post_id = :id"), {"id": post_id})
    if body.attachment_asset_ids:
        for idx, aid in enumerate(body.attachment_asset_ids):
            if not aid:
                continue
            db.execute(
                text("INSERT INTO post_attachments (post_id, asset_id, sort_order) VALUES (:pid, :aid, :ord)"),
                {"pid": post_id, "aid": aid, "ord": idx},
            )
    upload_dir = Path(UPLOAD_DIR)
    _relocate_post_temp_asset(body.thumbnail_asset_id, post_id, db, upload_dir)
    for aid in body.attachment_asset_ids or []:
        if aid:
            _relocate_post_temp_asset(aid, post_id, db, upload_dir)
    _relocate_post_content_temp_assets(post_id, body.content_html, db, upload_dir)
    # 본문 내 이미지 URL도 temp → 게시물ID로 갱신
    db.execute(
        text("UPDATE posts SET content_html = REPLACE(content_html, '/temp/', :pid_slash), content_json = REPLACE(COALESCE(content_json, ''), '/temp/', :pid_slash) WHERE id = :id"),
        {"pid_slash": f"/{post_id}/", "id": post_id},
    )
    db.commit()
    return {"id": post_id, "slug": slug}


@router.delete("/{post_id}")
def delete_post(post_id: int, db=Depends(get_db)):
    """글 삭제. post_tags는 FK ON DELETE CASCADE로 함께 삭제됨."""
    cur = db.execute(text("SELECT id FROM posts WHERE id = :id"), {"id": post_id}).fetchone()
    if not cur:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다.")
    db.execute(text("DELETE FROM posts WHERE id = :id"), {"id": post_id})
    db.commit()
    return None
