"""게시글 API (스텁). 실제 구현 시 DB 연동."""
from fastapi import APIRouter

router = APIRouter(tags=["posts"])


@router.get("")
def list_posts(
    page: int = 1,
    per_page: int = 10,
    category_id: int | None = None,
    tag_id: int | None = None,
    status: str | None = None,
):
    """글 목록 (페이지네이션). 현재 스텁."""
    return {"items": [], "total": 0}
