from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class PostInsight(BaseModel):
    post_id: str
    views: int
    unique_views: int
    impressions: int
    likes_count: int
    comments_count: int
    reposts_count: int


class FollowerStat(BaseModel):
    date: str
    follower_count: int


class AnalyticsSummary(BaseModel):
    total_posts: int
    total_likes_received: int
    total_comments_received: int
    total_reposts_received: int
    total_followers: int
    total_following: int
    avg_engagement_rate: float


class FollowerGrowthResponse(BaseModel):
    stats: List[FollowerStat]
    current_followers: int
    growth_percentage: float


class PostAnalyticsResponse(BaseModel):
    insights: List[PostInsight]
    top_performing_post: Optional[PostInsight] = None
    total_views: int
    avg_likes_per_post: float


class AnalyticsDashboardResponse(BaseModel):
    summary: AnalyticsSummary
    follower_growth: FollowerGrowthResponse
    post_analytics: PostAnalyticsResponse
