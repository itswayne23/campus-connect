from fastapi import APIRouter, Depends
from typing import Optional
from datetime import datetime, timedelta
from app.schemas.analytics import (
    AnalyticsDashboardResponse, 
    AnalyticsSummary, 
    FollowerGrowthResponse, 
    FollowerStat,
    PostAnalyticsResponse,
    PostInsight
)
from app.api.deps import get_current_user_id

router = APIRouter()


def get_service_client():
    from app.core import get_service_client as get_client
    return get_client()


@router.get("/dashboard", response_model=AnalyticsDashboardResponse)
async def get_analytics_dashboard(
    days: int = 30,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    profile_response = service.table("profiles").select("*").eq("id", current_user_id).execute()
    if not profile_response.data:
        profile_response = service.table("profiles").select("*").eq("id", current_user_id).execute()
    
    profile = profile_response.data[0]
    
    posts_response = service.table("posts").select("id, likes_count, comments_count").eq("author_id", current_user_id).execute()
    posts = posts_response.data
    total_posts = len(posts)
    
    likes_received = sum(p.get("likes_count", 0) for p in posts)
    comments_received = sum(p.get("comments_count", 0) for p in posts)
    
    reposts_response = service.table("reposts").select("id").eq("user_id", current_user_id).execute()
    reposts_given = len(reposts_response.data)
    
    reposts_received_response = service.table("reposts").select("id").execute()
    reposts_received = 0
    for r in reposts_received_response.data:
        post_response = service.table("posts").select("author_id").eq("id", r["post_id"]).execute()
        if post_response.data and post_response.data[0].get("author_id") == current_user_id:
            reposts_received += 1
    
    total_followers = profile.get("followers_count", 0)
    total_following = profile.get("following_count", 0)
    
    engagement_rate = 0.0
    if total_posts > 0 and total_followers > 0:
        total_engagement = likes_received + comments_received + reposts_received
        engagement_rate = (total_engagement / (total_posts * total_followers)) * 100 if total_followers > 0 else 0
    
    summary = AnalyticsSummary(
        total_posts=total_posts,
        total_likes_received=likes_received,
        total_comments_received=comments_received,
        total_reposts_received=reposts_received,
        total_followers=total_followers,
        total_following=total_following,
        avg_engagement_rate=round(engagement_rate, 2)
    )
    
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days)
    
    follower_stats_response = service.table("follower_analytics").select("*").eq("user_id", current_user_id).gte("recorded_at", start_date.isoformat()).lte("recorded_at", end_date.isoformat()).order("recorded_at", asc=True).execute()
    
    follower_stats = []
    for stat in follower_stats_response.data:
        follower_stats.append(FollowerStat(
            date=stat["recorded_at"],
            follower_count=stat["follower_count"]
        ))
    
    if not follower_stats:
        follower_stats.append(FollowerStat(
            date=end_date.isoformat(),
            follower_count=total_followers
        ))
    
    growth_percentage = 0.0
    if len(follower_stats) >= 2:
        old_count = follower_stats[0].follower_count
        new_count = follower_stats[-1].follower_count
        if old_count > 0:
            growth_percentage = round(((new_count - old_count) / old_count) * 100, 2)
    
    follower_growth = FollowerGrowthResponse(
        stats=follower_stats,
        current_followers=total_followers,
        growth_percentage=growth_percentage
    )
    
    post_analytics = []
    top_post = None
    total_views = 0
    
    for post in posts[:10]:
        analytics_response = service.table("post_analytics").select("*").eq("post_id", post["id"]).execute()
        analytics = analytics_response.data[0] if analytics_response.data else {"views": 0, "unique_views": 0, "impressions": post.get("likes_count", 0) * 10}
        
        insight = PostInsight(
            post_id=post["id"],
            views=analytics.get("views", 0),
            unique_views=analytics.get("unique_views", 0),
            impressions=analytics.get("impressions", 0),
            likes_count=post.get("likes_count", 0),
            comments_count=post.get("comments_count", 0),
            reposts_count=0
        )
        post_analytics.append(insight)
        total_views += insight.views
        
        if not top_post or insight.likes_count > top_post.likes_count:
            top_post = insight
    
    avg_likes = (likes_received / total_posts) if total_posts > 0 else 0
    
    post_analytics_response = PostAnalyticsResponse(
        insights=post_analytics,
        top_performing_post=top_post,
        total_views=total_views,
        avg_likes_per_post=round(avg_likes, 1)
    )
    
    return AnalyticsDashboardResponse(
        summary=summary,
        follower_growth=follower_growth,
        post_analytics=post_analytics_response
    )


@router.get("/posts/{post_id}")
async def get_post_insights(
    post_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    post_response = service.table("posts").select("*").eq("id", post_id).execute()
    if not post_response.data:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post = post_response.data[0]
    if post["author_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view insights for this post")
    
    analytics_response = service.table("post_analytics").select("*").eq("post_id", post_id).execute()
    analytics = analytics_response.data[0] if analytics_response.data else {"views": 0, "unique_views": 0, "impressions": 0}
    
    return PostInsight(
        post_id=post_id,
        views=analytics.get("views", 0),
        unique_views=analytics.get("unique_views", 0),
        impressions=analytics.get("impressions", 0),
        likes_count=post.get("likes_count", 0),
        comments_count=post.get("comments_count", 0),
        reposts_count=0
    )


@router.post("/track-view")
async def track_post_view(
    post_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    existing = service.table("post_analytics").select("*").eq("post_id", post_id).execute()
    
    if existing.data:
        service.table("post_analytics").update({
            "views": existing.data[0].get("views", 0) + 1,
            "unique_views": existing.data[0].get("unique_views", 0) + 1,
            "impressions": existing.data[0].get("impressions", 0) + 1
        }).eq("post_id", post_id).execute()
    else:
        service.table("post_analytics").insert({
            "post_id": post_id,
            "views": 1,
            "unique_views": 1,
            "impressions": 1
        }).execute()
    
    return {"success": True}


from fastapi import HTTPException
