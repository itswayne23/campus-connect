from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class TrendingTopic(BaseModel):
    hashtag: str
    post_count: int
    trend_score: float
    recent_posts: int

class TrendingCategory(BaseModel):
    name: str
    post_count: int
    trend_score: float

class TrendingResponse(BaseModel):
    topics: List[TrendingTopic]
    categories: List[TrendingCategory]
    last_updated: datetime
