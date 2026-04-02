from fastapi import APIRouter
from .endpoints.auth import router as auth_router
from .endpoints.users import router as users_router
from .endpoints.posts import router as posts_router
from .endpoints.anonymous import router as anonymous_router
from .endpoints.comments import router as comments_router
from .endpoints.messages import router as messages_router
from .endpoints.notifications import router as notifications_router


api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(posts_router, prefix="/posts", tags=["Posts"])
api_router.include_router(anonymous_router, prefix="/anonymous", tags=["Anonymous"])
api_router.include_router(comments_router, prefix="", tags=["Comments"])
api_router.include_router(messages_router, prefix="/messages", tags=["Messages"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
