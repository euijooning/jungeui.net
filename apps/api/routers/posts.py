"""게시글 API."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, ProgrammingError, SQLAlchemyError

from apps.api.core import get_db

router = APIRouter(tags=["posts"])


class PostBody(BaseModel):
    title: str = ""
    slug: str = ""
    status: str = "DRAFT"
    published_at: str | None = None
    category_id: int | None = None
    thumbnail_asset_id: int | None = None
    content_html: str | None = None
    content_json: str | None = None
    post_tags: list[int] = []
    attachment_asset_ids: list[int] = []


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


@router.get("")
def list_posts(
    page: int = 1,
    per_page: int = 10,
    category_id: int | None = None,
    tag_id: int | None = None,
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
        where.append("p.category_id = :category_id")
        filter_params["category_id"] = category_id
    if status:
        where.append("p.status = :status")
        filter_params["status"] = status
    if tag_id is not None:
        where.append("EXISTS (SELECT 1 FROM post_tags pt WHERE pt.post_id = p.id AND pt.tag_id = :tag_id)")
        filter_params["tag_id"] = tag_id
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
        order_sql = "ORDER BY p.id DESC"
    else:
        # MySQL 호환: NULLS LAST 대신 published_at IS NULL ASC (널이 마지막으로)
        order_sql = "ORDER BY p.published_at IS NULL, p.published_at DESC, p.id DESC"
    rows = db.execute(
        text(f"""
            SELECT p.id, p.title, p.slug, p.status, p.published_at, p.created_at, p.updated_at,
                   p.category_id, c.name AS category_name
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
            "published_at": r[4].isoformat() if r[4] else None,
            "created_at": r[5].isoformat() if r[5] else None,
            "updated_at": r[6].isoformat() if r[6] else None,
            "category_id": r[7],
            "category_name": r[8],
            "category": {"id": r[7], "name": r[8]} if r[7] else None,
        })
    return {"items": items, "total": total}


@router.get("/{post_id}")
def get_post(post_id: int, db=Depends(get_db)):
    """글 단건 조회."""
    row = db.execute(
        text("""
            SELECT p.id, p.title, p.slug, p.status, p.published_at, p.category_id, p.thumbnail_asset_id,
                   p.content_html, p.content_json, p.created_at, p.updated_at,
                   c.name AS category_name
            FROM posts p
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.id = :id
        """),
        {"id": post_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다.")
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
        "id": row[0],
        "title": row[1],
        "slug": row[2],
        "status": row[3],
        "published_at": row[4].isoformat() if row[4] else None,
        "category_id": row[5],
        "thumbnail_asset_id": row[6],
        "content_html": row[7],
        "content_json": row[8],
        "created_at": row[9].isoformat() if row[9] else None,
        "updated_at": row[10].isoformat() if row[10] else None,
        "category_name": row[11],
        "post_tags": [r[0] for r in tag_rows],
        "tags": [{"id": r[0], "name": r[1]} for r in tag_rows],
        "attachments": attachments,
    }


@router.post("")
def create_post(body: PostBody, db=Depends(get_db)):
    """글 생성."""
    slug = _unique_slug(db, (body.slug or "").strip() or "untitled")
    published = body.published_at if body.published_at else None
    db.execute(
        text("""
            INSERT INTO posts (title, slug, status, published_at, category_id, thumbnail_asset_id, content_html, content_json)
            VALUES (:title, :slug, :status, :published_at, :category_id, :thumbnail_asset_id, :content_html, :content_json)
        """),
        {
            "title": (body.title or "제목 없음").strip(),
            "slug": slug,
            "status": body.status or "DRAFT",
            "published_at": published,
            "category_id": body.category_id,
            "thumbnail_asset_id": body.thumbnail_asset_id,
            "content_html": body.content_html,
            "content_json": body.content_json,
        },
    )
    db.commit()
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
        db.commit()
    if new_id and body.attachment_asset_ids:
        for idx, aid in enumerate(body.attachment_asset_ids):
            if not aid:
                continue
            db.execute(
                text("INSERT INTO post_attachments (post_id, asset_id, sort_order) VALUES (:pid, :aid, :ord)"),
                {"pid": new_id, "aid": aid, "ord": idx},
            )
        db.commit()
    return {"id": new_id, "slug": slug}


@router.put("/{post_id}")
def update_post(post_id: int, body: PostBody, db=Depends(get_db)):
    """글 수정."""
    cur = db.execute(text("SELECT id FROM posts WHERE id = :id"), {"id": post_id}).fetchone()
    if not cur:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다.")
    slug = _unique_slug(db, (body.slug or "").strip() or "untitled", exclude_id=post_id)
    published = body.published_at if body.published_at else None
    db.execute(
        text("""
            UPDATE posts SET title = :title, slug = :slug, status = :status, published_at = :published_at,
                   category_id = :category_id, thumbnail_asset_id = :thumbnail_asset_id,
                   content_html = :content_html, content_json = :content_json, updated_at = NOW()
            WHERE id = :id
        """),
        {
            "id": post_id,
            "title": (body.title or "제목 없음").strip(),
            "slug": slug,
            "status": body.status or "DRAFT",
            "published_at": published,
            "category_id": body.category_id,
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
