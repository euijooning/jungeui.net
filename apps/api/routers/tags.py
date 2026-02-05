"""태그 API (스텁). 실제 구현 시 DB 연동."""
from fastapi import APIRouter

router = APIRouter(tags=["tags"])


@router.get("")
def list_tags():
    """태그 목록. 현재 스텁."""
    return []
