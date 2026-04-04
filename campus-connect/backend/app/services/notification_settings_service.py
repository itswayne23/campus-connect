from supabase import create_client
from app.core.config import settings
from app.schemas.notification_settings import NotificationSettings, NotificationSettingsResponse, PushSubscription

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

async def get_notification_settings(user_id: str) -> NotificationSettingsResponse:
    result = supabase.table('notification_settings').select('*').eq('user_id', user_id).execute()
    
    if result.data:
        settings_data = result.data[0]
        push_subscribed = settings_data.get('push_endpoint') is not None
        return NotificationSettingsResponse(
            push_likes=settings_data.get('push_likes', True),
            push_comments=settings_data.get('push_comments', True),
            push_follows=settings_data.get('push_follows', True),
            push_messages=settings_data.get('push_messages', True),
            push_mentions=settings_data.get('push_mentions', True),
            email_likes=settings_data.get('email_likes', False),
            email_comments=settings_data.get('email_comments', False),
            email_follows=settings_data.get('email_follows', True),
            email_messages=settings_data.get('email_messages', False),
            email_mentions=settings_data.get('email_mentions', True),
            push_subscribed=push_subscribed
        )
    
    return NotificationSettingsResponse()

async def update_notification_settings(user_id: str, settings: NotificationSettings) -> NotificationSettingsResponse:
    settings_dict = settings.model_dump()
    
    existing = supabase.table('notification_settings').select('*').eq('user_id', user_id).execute()
    
    if existing.data:
        supabase.table('notification_settings').update(settings_dict).eq('user_id', user_id).execute()
    else:
        settings_dict['user_id'] = user_id
        supabase.table('notification_settings').insert(settings_dict).execute()
    
    return await get_notification_settings(user_id)

async def save_push_subscription(user_id: str, subscription: PushSubscription) -> dict:
    existing = supabase.table('notification_settings').select('*').eq('user_id', user_id).execute()
    
    data = {
        'user_id': user_id,
        'push_endpoint': subscription.endpoint,
        'push_keys_p256dh': subscription.keys.get('p256dh'),
        'push_keys_auth': subscription.keys.get('auth')
    }
    
    if existing.data:
        supabase.table('notification_settings').update(data).eq('user_id', user_id).execute()
    else:
        supabase.table('notification_settings').insert(data).execute()
    
    return {"message": "Push subscription saved"}

async def remove_push_subscription(user_id: str) -> dict:
    supabase.table('notification_settings').update({
        'push_endpoint': None,
        'push_keys_p256dh': None,
        'push_keys_auth': None
    }).eq('user_id', user_id).execute()
    
    return {"message": "Push subscription removed"}
