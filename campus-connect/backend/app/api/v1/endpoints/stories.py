from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from typing import List
from app.schemas.story import StoryCreate, StoryResponse, UserStories, StoryViewResponse, StoryDeleteResponse
from app.services.story_service import story_service
from app.api.deps import get_current_user_id
import uuid
import os

router = APIRouter()

@router.post("", response_model=StoryResponse)
async def create_story(
    story_data: StoryCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    story = await story_service.create_story(
        current_user_id,
        story_data.media_url,
        story_data.media_type,
        story_data.caption
    )
    
    if not story:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create story"
        )
    
    return story

@router.get("/feed", response_model=List[UserStories])
async def get_stories_feed(
    current_user_id: str = Depends(get_current_user_id)
):
    stories = await story_service.get_following_stories(current_user_id, current_user_id)
    return stories

@router.get("/my", response_model=List[StoryResponse])
async def get_my_stories(
    current_user_id: str = Depends(get_current_user_id)
):
    stories = await story_service.get_user_stories(current_user_id, current_user_id)
    return stories

@router.get("/{story_id}", response_model=StoryResponse)
async def get_story(
    story_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    story = await story_service.get_story_by_id(story_id, current_user_id)
    
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )
    
    return story

@router.post("/{story_id}/view", response_model=StoryViewResponse)
async def view_story(
    story_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    result = await story_service.view_story(story_id, current_user_id)
    return result

@router.delete("/{story_id}", response_model=StoryDeleteResponse)
async def delete_story(
    story_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    result = await story_service.delete_story(story_id, current_user_id)
    return result

@router.post("/media/upload")
async def upload_story_media(
    file: UploadFile = File(...),
    current_user_id: str = Depends(get_current_user_id)
):
    from app.core import get_service_client
    
    service = get_service_client()
    
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_ext = os.path.splitext(file.filename)[1].lower()
    allowed_images = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    allowed_videos = ['.mp4', '.mov', '.webm']
    
    is_video = file_ext in allowed_videos
    is_image = file_ext in allowed_images
    
    if not (is_image or is_video):
        raise HTTPException(
            status_code=400,
            detail="File type not allowed. Images: jpg, png, gif, webp. Videos: mp4, mov, webm"
        )
    
    bucket_name = "stories"
    file_name = f"{uuid.uuid4()}{file_ext}"
    
    try:
        content = await file.read()
        
        service.storage.from_(bucket_name).upload(file_name, content, {"content-type": file.content_type})
        
        public_url = service.storage.from_(bucket_name).get_public_url(file_name)
        
        return {
            "url": public_url,
            "type": "video" if is_video else "image"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )
