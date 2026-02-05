from fastapi import APIRouter

from apps.api.routers import auth, health

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(auth.router)
