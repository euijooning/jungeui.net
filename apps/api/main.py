"""Jungeui LabREST API - FastAPI 진입점."""
from contextlib import asynccontextmanager
from pathlib import Path

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import RedirectResponse
from starlette.staticfiles import StaticFiles

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.api.core import CORS_ORIGINS, UPLOAD_DIR
from apps.api.core.config import NAKED_HOST, REDIRECT_WWW_TO_NAKED, WWW_HOST
from apps.api.core.db_init import init_on_startup
from apps.api.routers import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """서버 시작 시 DB 테이블·시드 자동 초기화."""
    init_on_startup()
    yield


app = FastAPI(
    title="Jungeui LabAPI",
    description="블로그·포트폴리오 백엔드",
    version="0.1.0",
    lifespan=lifespan,
)


class RedirectWWWMiddleware(BaseHTTPMiddleware):
    """www.jungeui.net → jungeui.net 301 리다이렉트 (REDIRECT_WWW_TO_NAKED=true 시)."""

    async def dispatch(self, request: Request, call_next):
        if REDIRECT_WWW_TO_NAKED and request.url.hostname == WWW_HOST:
            path = request.scope.get("path", "/")
            qs = request.scope.get("query_string", b"").decode()
            location = f"https://{NAKED_HOST}{path}" + (f"?{qs}" if qs else "")
            return RedirectResponse(url=location, status_code=301)
        return await call_next(request)


if REDIRECT_WWW_TO_NAKED:
    app.add_middleware(RedirectWWWMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

# 업로드 파일 서빙
_upload_dir = Path(UPLOAD_DIR)
_upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=str(_upload_dir)), name="uploads")


@app.get("/")
def root():
    return {"message": "Jungeui LabAPI", "docs": "/docs"}
