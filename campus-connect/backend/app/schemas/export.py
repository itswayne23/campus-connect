from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DataExportStatus(BaseModel):
    id: str
    status: str
    file_url: Optional[str]
    requested_at: datetime
    completed_at: Optional[datetime]
    expires_at: Optional[datetime]


class DataExportRequest(BaseModel):
    export_type: str = "all"


class ExportDataResponse(BaseModel):
    user: dict
    posts: List[dict]
    comments: List[dict]
    likes: List[dict]
    follows: List[dict]
    messages: List[dict]
    notifications: List[dict]
    exported_at: datetime
