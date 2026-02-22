"""자산(파일) 업로드 API."""
import uuid
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import text
from starlette.responses import FileResponse

from apps.api.core import get_db, UPLOAD_DIR

router = APIRouter(prefix="/assets", tags=["assets"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# 허용 이미지 MIME
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"}
# 허용 문서 MIME (일부 브라우저가 octet-stream으로 올 수 있음)
ALLOWED_DOCUMENT_TYPES = {
    "application/pdf",
    "application/vnd.ms-powerpoint",  # ppt
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",  # pptx
    "application/x-hwp",
    "application/octet-stream",  # hwp/hwpx 등
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # docx
}
ALLOWED_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_DOCUMENT_TYPES

# 확장자 화이트리스트 (MIME 2차 검증)
ALLOWED_EXTENSIONS = {
    "png", "jpg", "jpeg", "gif", "webp",
    "pdf", "ppt", "pptx", "hwp", "hwpx", "docx",
}


def _get_ext(filename: str) -> str:
    ext = (filename or "").split(".")[-1].lower()
    return ext if ext in ALLOWED_EXTENSIONS else ""


def _is_image_ext(ext: str) -> bool:
    return ext in ("png", "jpg", "jpeg", "gif", "webp")


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    post_id: str | None = Query(None, description="게시글 ID, 없으면 temp"),
    folder: str | None = Query(None, description="projects일 때 projects/{subdir}/ 경로 사용"),
    db=Depends(get_db),
):
    """파일 업로드 (이미지 + 문서). multipart/form-data, 필드명 'file'. 허용: png, jpg, jpeg, gif, webp, pdf, ppt, pptx, hwp, hwpx, docx. 최대 10MB. assets 테이블에 저장 후 id 반환."""
    ext = _get_ext(file.filename or "")
    if not ext:
        raise HTTPException(
            status_code=400,
            detail="허용되지 않는 파일 형식입니다. (허용: png, jpg, jpeg, gif, webp, pdf, ppt, pptx, hwp, hwpx, docx)",
        )
    content_type = file.content_type or ""
    if content_type and content_type not in ALLOWED_TYPES:
        # octet-stream은 확장자로만 허용 (hwp 등)
        if content_type != "application/octet-stream" or ext not in ("hwp", "hwpx"):
            raise HTTPException(
                status_code=400,
                detail="허용되지 않는 파일 형식입니다.",
            )

    pid = (post_id or "temp").strip() or "temp"
    name = f"{uuid.uuid4().hex[:12]}.{ext}"
    if folder == "projects":
        rel_path = f"images/projects/{pid}/{name}"
    elif folder == "careers":
        rel_path = f"images/careers/{pid}/{name}"
    else:
        now = datetime.now()
        year = now.strftime("%Y")
        month = now.strftime("%m")
        day = now.strftime("%d")
        if _is_image_ext(ext):
            rel_path = f"images/posts/{year}/{month}/{day}/{pid}/{name}"
        else:
            rel_path = f"documents/{year}/{month}/{day}/{pid}/{name}"
    dest = Path(UPLOAD_DIR) / rel_path
    dest.parent.mkdir(parents=True, exist_ok=True)

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="파일 크기는 10MB 이하여야 합니다.")

    dest.write_bytes(content)

    url = f"/static/uploads/{rel_path.replace(chr(92), '/')}"
    original_name = (file.filename or name).strip() or name
    mime_type = content_type or "application/octet-stream"
    file_path = rel_path.replace(chr(92), "/")

    db.execute(
        text("""
            INSERT INTO assets (uuid_name, original_name, mime_type, file_path, size_bytes)
            VALUES (:uuid_name, :original_name, :mime_type, :file_path, :size_bytes)
        """),
        {
            "uuid_name": name,
            "original_name": original_name,
            "mime_type": mime_type,
            "file_path": file_path,
            "size_bytes": len(content),
        },
    )
    row = db.execute(text("SELECT LAST_INSERT_ID()")).fetchone()
    asset_id = (row[0] if row and row[0] else None)
    db.commit()
    if not asset_id:
        row2 = db.execute(text("SELECT id FROM assets ORDER BY id DESC LIMIT 1")).fetchone()
        asset_id = row2[0] if row2 else None

    return {"id": asset_id, "url": url, "original_name": original_name}


@router.get("/{asset_id}/download")
def download_asset(asset_id: int, db=Depends(get_db)):
    """자산 파일 다운로드. Content-Disposition: attachment 로 저장 유도."""
    row = db.execute(
        text("SELECT original_name, file_path FROM assets WHERE id = :id"),
        {"id": asset_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    original_name, file_path = row[0], row[1]
    if not file_path:
        raise HTTPException(status_code=404, detail="파일 경로가 없습니다.")
    full_path = Path(UPLOAD_DIR) / file_path.replace("\\", "/")
    if not full_path.is_file():
        raise HTTPException(status_code=404, detail="파일이 존재하지 않습니다.")
    # RFC 5987: filename*=UTF-8''encoded; filename="ascii_fallback"
    safe_ascii = original_name.encode("ascii", "replace").decode("ascii") or "download"
    encoded_name = quote(original_name, safe="")
    disposition = f"attachment; filename=\"{safe_ascii}\"; filename*=UTF-8''{encoded_name}"
    return FileResponse(
        path=str(full_path),
        filename=original_name,
        media_type="application/octet-stream",
        headers={"Content-Disposition": disposition},
    )
