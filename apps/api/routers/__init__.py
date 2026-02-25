from fastapi import APIRouter

from apps.api.routers import auth, health
from apps.api.routers import about, about_messages, assets, categories, careers, dashboard, post_prefixes, posts, projects, tags

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(about.router)
api_router.include_router(about_messages.router)
api_router.include_router(dashboard.router)
api_router.include_router(assets.router)
api_router.include_router(categories.router, prefix="/categories")
api_router.include_router(post_prefixes.router, prefix="/post_prefixes")
api_router.include_router(tags.router, prefix="/tags")
api_router.include_router(posts.router, prefix="/posts")
api_router.include_router(careers.router, prefix="/careers")
api_router.include_router(projects.router, prefix="/projects")
