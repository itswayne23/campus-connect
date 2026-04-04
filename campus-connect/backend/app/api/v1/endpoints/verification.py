from fastapi import APIRouter, HTTPException, Depends
from app.schemas.verification import VerifyUserRequest, VerifyUserResponse, UserBadgesResponse, BadgeResponse
from app.api.deps import get_current_user_id

router = APIRouter()


def get_service_client():
    from app.core import get_service_client as get_client
    return get_client()


@router.post("/verify", response_model=VerifyUserResponse)
async def verify_user(
    request: VerifyUserRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    user_response = service.table("profiles").select("role").eq("id", current_user_id).execute()
    if not user_response.data or user_response.data[0].get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service.table("profiles").update({"is_verified": request.verify}).eq("id", request.user_id).execute()
    
    return {
        "user_id": request.user_id,
        "is_verified": request.verify,
        "message": f"User {'verified' if request.verify else 'unverified'} successfully"
    }


@router.get("/badges", response_model=UserBadgesResponse)
async def get_user_badges(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    badges_response = service.table("badges").select("*").execute()
    
    user_badges_response = service.table("user_badges").select("badge_id, earned_at").eq("user_id", user_id).execute()
    earned_badge_ids = {ub["badge_id"]: ub["earned_at"] for ub in user_badges_response.data}
    
    badges = []
    for badge in badges_response.data:
        badges.append(BadgeResponse(
            id=badge["id"],
            name=badge["name"],
            description=badge["description"],
            icon=badge["icon"],
            category=badge["category"],
            earned_at=earned_badge_ids.get(badge["id"])
        ))
    
    earned_count = len(earned_badge_ids)
    
    return {
        "badges": badges,
        "total_badges": earned_count
    }


@router.get("/my-badges", response_model=UserBadgesResponse)
async def get_my_badges(
    current_user_id: str = Depends(get_current_user_id)
):
    return await get_user_badges(user_id=current_user_id, current_user_id=current_user_id)


@router.post("/check-badges")
async def check_and_award_badges(
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    profile_response = service.table("profiles").select("*").eq("id", current_user_id).execute()
    if not profile_response.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile = profile_response.data[0]
    
    likes_response = service.table("likes").select("post_id").eq("user_id", current_user_id).execute()
    likes_given = len(likes_response.data)
    
    posts_liked_response = service.table("likes").select("user_id").eq("post_id", any_=[
        p["id"] for p in service.table("posts").select("id").eq("author_id", current_user_id).execute().data
    ]).execute()
    likes_received = len(posts_liked_response.data)
    
    comments_response = service.table("comments").select("id").eq("author_id", current_user_id).execute()
    comments_count = len(comments_response.data)
    
    badges_response = service.table("badges").select("*").execute()
    user_badges_response = service.table("user_badges").select("badge_id").eq("user_id", current_user_id).execute()
    earned_badge_ids = {ub["badge_id"] for ub in user_badges_response.data}
    
    new_badges = []
    for badge in badges_response.data:
        if badge["id"] in earned_badge_ids:
            continue
        
        earned = False
        criteria_type = badge.get("criteria_type")
        criteria_value = badge.get("criteria_value", 1)
        
        if criteria_type == "posts" and profile.get("posts_count", 0) >= criteria_value:
            earned = True
        elif criteria_type == "followers" and profile.get("followers_count", 0) >= criteria_value:
            earned = True
        elif criteria_type == "likes_given" and likes_given >= criteria_value:
            earned = True
        elif criteria_type == "likes_received" and likes_received >= criteria_value:
            earned = True
        elif criteria_type == "comments" and comments_count >= criteria_value:
            earned = True
        elif criteria_type == "verified" and profile.get("is_verified", False):
            earned = True
        
        if earned:
            service.table("user_badges").insert({
                "user_id": current_user_id,
                "badge_id": badge["id"]
            }).execute()
            new_badges.append(badge["name"])
    
    return {
        "new_badges_earned": new_badges,
        "total_badges": len(earned_badge_ids) + len(new_badges)
    }
