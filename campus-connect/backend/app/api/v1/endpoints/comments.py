from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from app.schemas.post import CommentCreate, CommentResponse
from app.services.post_service import post_service
from app.api.deps import get_current_user_id

router = APIRouter()

@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
async def get_comments(
    post_id: str,
    current_user_id: Optional[str] = Depends(get_current_user_id)
):
    comments = await post_service.get_comments(post_id, current_user_id)
    return comments

@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
async def create_comment(
    post_id: str,
    comment_data: CommentCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    post = await post_service.get_post_by_id(post_id, current_user_id)
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comment = await post_service.create_comment(
        post_id=post_id,
        author_id=current_user_id,
        content=comment_data.content,
        is_anonymous=comment_data.is_anonymous,
        parent_id=comment_data.parent_id
    )
    
    if not comment:
        raise HTTPException(status_code=500, detail="Failed to create comment")
    
    return comment

@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    service = post_service.supabase
    
    comment = service.table("comments").select("author_id").eq("id", comment_id).execute()
    
    if not comment.data:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.data[0]["author_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    service.table("comments").delete().eq("id", comment_id).execute()
    
    return {"message": "Comment deleted successfully"}
