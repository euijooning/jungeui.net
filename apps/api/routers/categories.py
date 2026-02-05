"""카테고리 API (스텁). 실제 구현 시 DB 연동."""
from fastapi import APIRouter

router = APIRouter(tags=["categories"])


@router.get("")
def list_categories():
    """카테고리 목록. 현재 스텁."""
    return []
