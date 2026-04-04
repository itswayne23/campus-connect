from supabase import create_client
from app.core.config import settings
from app.schemas.scheduled_post import ScheduledPostCreate, ScheduledPostUpdate, ScheduledPostResponse, ScheduledPostStatus
from datetime import datetime

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

async def create_scheduled_post(user_id: str, data: ScheduledPostCreate) -> ScheduledPostResponse:
    post_data = {
        'user_id': user_id,
        'content': data.content,
        'media_urls': data.media_urls,
        'category': data.category,
        'poll_data': data.poll_data,
        'is_anonymous': data.is_anonymous,
        'scheduled_at': data.scheduled_at.isoformat(),
        'status': ScheduledPostStatus.PENDING.value,
    }
    
    result = supabase.table('scheduled_posts').insert(post_data).execute()
    
    if result.data:
        return ScheduledPostResponse(**result.data[0])
    
    raise Exception("Failed to create scheduled post")

async def get_scheduled_posts(user_id: str) -> list[ScheduledPostResponse]:
    result = supabase.table('scheduled_posts').select('*').eq('user_id', user_id).eq('status', 'pending').order('scheduled_at', desc=False).execute()
    
    return [ScheduledPostResponse(**post) for post in result.data]

async def get_scheduled_post(post_id: str, user_id: str) -> ScheduledPostResponse:
    result = supabase.table('scheduled_posts').select('*').eq('id', post_id).eq('user_id', user_id).execute()
    
    if result.data:
        return ScheduledPostResponse(**result.data[0])
    
    raise Exception("Scheduled post not found")

async def update_scheduled_post(post_id: str, user_id: str, data: ScheduledPostUpdate) -> ScheduledPostResponse:
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    if 'scheduled_at' in update_data and update_data['scheduled_at']:
        update_data['scheduled_at'] = update_data['scheduled_at'].isoformat()
    
    result = supabase.table('scheduled_posts').update(update_data).eq('id', post_id).eq('user_id', user_id).execute()
    
    if result.data:
        return ScheduledPostResponse(**result.data[0])
    
    raise Exception("Failed to update scheduled post")

async def cancel_scheduled_post(post_id: str, user_id: str) -> dict:
    result = supabase.table('scheduled_posts').update({'status': ScheduledPostStatus.CANCELLED.value}).eq('id', post_id).eq('user_id', user_id).execute()
    
    if result.data:
        return {"message": "Scheduled post cancelled"}
    
    raise Exception("Failed to cancel scheduled post")

async def delete_scheduled_post(post_id: str, user_id: str) -> dict:
    result = supabase.table('scheduled_posts').delete().eq('id', post_id).eq('user_id', user_id).execute()
    
    return {"message": "Scheduled post deleted"}

async def get_due_scheduled_posts() -> list[dict]:
    now = datetime.utcnow().isoformat()
    result = supabase.table('scheduled_posts').select('*').eq('status', 'pending').lte('scheduled_at', now).execute()
    return result.data
