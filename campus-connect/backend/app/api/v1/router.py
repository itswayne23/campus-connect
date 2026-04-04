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
from .endpoints.message_enhancements import router as message_enhancements_router
from .endpoints.admin_management import router as admin_management_router
from .endpoints.activity import router as activity_router
from .endpoints.export import router as export_router
from .endpoints.collections import router as collections_router
from .endpoints.social import router as social_router
from .endpoints.engagement import router as engagement_router
from .endpoints.mood import router as mood_router
from .endpoints.study_partner import router as study_partner_router
from .endpoints.professor import router as professor_router
from .endpoints.course_review import router as course_review_router
from .endpoints.gamification import router as gamification_router
from .endpoints.ai_chat import router as ai_chat_router


api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(posts_router, prefix="/posts", tags=["Posts"])
api_router.include_router(anonymous_router, prefix="/anonymous", tags=["Anonymous"])
api_router.include_router(comments_router, prefix="", tags=["Comments"])
api_router.include_router(messages_router, prefix="/messages", tags=["Messages"])
api_router.include_router(message_enhancements_router, prefix="/messages", tags=["Message Enhancements"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(stories_router, prefix="/stories", tags=["Stories"])
api_router.include_router(drafts_router, prefix="/drafts", tags=["Drafts"])
api_router.include_router(scheduled_posts_router, prefix="/scheduled", tags=["Scheduled Posts"])
api_router.include_router(trending_router, prefix="/trending", tags=["Trending"])
api_router.include_router(verification_router, prefix="/verification", tags=["Verification & Badges"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(admin_management_router, prefix="/admin", tags=["Admin Management"])
api_router.include_router(activity_router, prefix="/activity", tags=["Activity Log"])
api_router.include_router(export_router, prefix="/export", tags=["Data Export"])
api_router.include_router(collections_router, prefix="/features", tags=["Collections & Theme"])
api_router.include_router(social_router, prefix="/social", tags=["Social Features"])
api_router.include_router(engagement_router, prefix="/engagement", tags=["Engagement"])
api_router.include_router(mood_router, prefix="/mood", tags=["Mood Tracking"])
api_router.include_router(study_partner_router, prefix="/study", tags=["Study Partners"])
api_router.include_router(professor_router, prefix="/professors", tags=["Professor Ratings"])
api_router.include_router(course_review_router, prefix="/courses", tags=["Course Reviews"])
api_router.include_router(gamification_router, prefix="/gamification", tags=["Gamification"])
api_router.include_router(ai_chat_router, prefix="/ai", tags=["AI Chat"])
