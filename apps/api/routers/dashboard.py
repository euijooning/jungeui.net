"""대시보드 통계 API."""
from fastapi import APIRouter, Depends
from sqlalchemy import text

from apps.api.core import get_db
from apps.api.core.config import get_today_iso
from apps.api.routers.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_dashboard_stats(db=Depends(get_db), user=Depends(get_current_user)):
    """
    대시보드 통계.
    - today_visits: 오늘 방문자 수 (daily_stats.visitor_count)
    - total_views: 전일까지 누적 조회수 (daily_stats SUM total_views)
    - published_posts: 발행된 글 수 (PUBLISHED + UNLISTED)
    """
    today = get_today_iso()

    # 오늘 방문자
    row_today = db.execute(
        text("SELECT visitor_count FROM daily_stats WHERE date = :dt"),
        {"dt": today},
    ).fetchone()
    today_visits = (row_today[0] or 0) if row_today else 0

    # 전일까지 누적 조회수
    row_views = db.execute(
        text("SELECT COALESCE(SUM(total_views), 0) FROM daily_stats WHERE date < :dt"),
        {"dt": today},
    ).fetchone()
    total_views = (row_views[0] or 0) if row_views else 0

    # 발행 포스트 수 (PUBLISHED, UNLISTED)
    row_posts = db.execute(
        text(
            "SELECT COUNT(*) FROM posts WHERE status IN ('PUBLISHED', 'UNLISTED')"
        ),
    ).fetchone()
    published_posts = (row_posts[0] or 0) if row_posts else 0

    return {
        "today_visits": today_visits,
        "total_views": total_views,
        "published_posts": published_posts,
    }


@router.get("/recent-activity")
def get_recent_activity(db=Depends(get_db), user=Depends(get_current_user)):
    """
    최근 수정된 글 5건 (id, title, slug, status, updated_at).
    백오피스 대시보드 '최근 활동'용.
    """
    rows = db.execute(
        text("""
            SELECT id, title, slug, status, updated_at
            FROM posts
            ORDER BY updated_at DESC
            LIMIT 5
        """),
    ).fetchall()
    recent_posts = [
        {
            "id": r[0],
            "title": r[1],
            "slug": r[2],
            "status": r[3],
            "updated_at": r[4].isoformat() if r[4] else None,
        }
        for r in rows
    ]
    return {"recent_posts": recent_posts}
