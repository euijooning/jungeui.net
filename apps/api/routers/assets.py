"""자산(파일) 업로드 API."""
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from apps.api.core import UPLOAD_DIR

router = APIRouter(prefix="/assets", tags=["assets"])

# 허용 이미지 MIME
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    post_id: str | None = Query(None, description="게시글 ID, 없으면 temp"),
):
    """이미지 파일 업로드. multipart/form-data, 필드명 'file'. post_id 없으면 temp 폴더."""
    if not file.content_type or file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"허용되지 않는 파일 형식입니다. (허용: jpeg, png, gif, webp)",
        )

    # 저장 경로: images/연도/월/날짜/게시글id/이미지이름
    now = datetime.now()
    year = now.strftime("%Y")
    month = now.strftime("%m")
    day = now.strftime("%d")
    pid = (post_id or "temp").strip() or "temp"
    ext = (file.filename or "").split(".")[-1].lower() or "jpg"
    if ext not in ("jpeg", "jpg", "png", "gif", "webp"):
        ext = "jpg"
    name = f"{uuid.uuid4().hex[:12]}.{ext}"
    rel_path = f"images/{year}/{month}/{day}/{pid}/{name}"
    dest = UPLOAD_DIR / rel_path
    dest.parent.mkdir(parents=True, exist_ok=True)

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(status_code=413, detail="파일 크기는 10MB 이하여야 합니다.")

    dest.write_bytes(content)

    # URL: /static/uploads/images/...
    url = f"/static/uploads/{rel_path.replace(chr(92), '/')}"
    return {"url": url}
