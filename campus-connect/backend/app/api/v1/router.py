from fastapi import APIRouter
from .endpoints.auth import router as auth_router
from .endpoints.users import router as users_router
from .endpoints.posts import router as posts_router
from .endpoints.anonymous import router as anonymous_router
from .endpoints.comments import router as comments_router
from .endpoints.messages import router as messages_router
from .endpoints.notifications import router as notifications_router
from .endpoints.stories import router as stories_router
from .endpoints.drafts import router as drafts_router
from .endpoints.scheduled_posts import router as scheduled_posts_router
from .endpoints.trending import router as trending_router
from .endpoints.verification import router as verification_router
from .endpoints.analytics import router as analytics_router


api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(posts_router, prefix="/posts", tags=["Posts"])
api_router.include_router(anonymous_router, prefix="/anonymous", tags=["Anonymous"])
api_router.include_router(comments_router, prefix="", tags=["Comments"])
api_router.include_router(messages_router, prefix="/messages", tags=["Messages"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(stories_router, prefix="/stories", tags=["Stories"])
api_router.include_router(drafts_router, prefix="/drafts", tags=["Drafts"])
api_router.include_router(scheduled_posts_router, prefix="/scheduled", tags=["Scheduled Posts"])
api_router.include_router(trending_router, prefix="/trending", tags=["Trending"])
api_router.include_router(verification_router, prefix="/verification", tags=["Verification & Badges"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
