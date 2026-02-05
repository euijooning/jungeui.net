"""Jungeui LabREST API - FastAPI 진입점."""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import RedirectResponse

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.api.core import CORS_ORIGINS
from apps.api.core.config import NAKED_HOST, REDIRECT_WWW_TO_NAKED, WWW_HOST
from apps.api.routers import api_router

app = FastAPI(
    title="Jungeui LabAPI",
    description="블로그·포트폴리오 백엔드",
    version="0.1.0",
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


@app.get("/")
def root():
    return {"message": "Jungeui LabAPI", "docs": "/docs"}
