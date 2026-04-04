from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class ActivityLogItem(BaseModel):
    id: str
    user_id: str
    action_type: str
    entity_type: Optional[str]
    entity_id: Optional[str]
    metadata: Dict[str, Any]
    created_at: datetime


class ActivityLogResponse(BaseModel):
    activities: List[ActivityLogItem]
    total: int
    has_more: bool


class CreateActivityRequest(BaseModel):
    action_type: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    metadata: Dict[str, Any] = {}
