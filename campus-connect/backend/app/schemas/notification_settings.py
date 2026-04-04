from pydantic import BaseModel
from typing import Optional

class NotificationSettings(BaseModel):
    push_likes: bool = True
    push_comments: bool = True
    push_follows: bool = True
    push_messages: bool = True
    push_mentions: bool = True
    email_likes: bool = False
    email_comments: bool = False
    email_follows: bool = True
    email_messages: bool = False
    email_mentions: bool = True

class NotificationSettingsResponse(BaseModel):
    push_likes: bool = True
    push_comments: bool = True
    push_follows: bool = True
    push_messages: bool = True
    push_mentions: bool = True
    email_likes: bool = False
    email_comments: bool = False
    email_follows: bool = True
    email_messages: bool = False
    email_mentions: bool = True
    push_subscribed: bool = False

class PushSubscription(BaseModel):
    endpoint: str
    keys: dict
