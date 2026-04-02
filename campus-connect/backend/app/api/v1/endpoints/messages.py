from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List
from app.schemas.message import MessageCreate, MessageResponse, ConversationResponse
from app.services.message_service import message_service
from app.api.deps import get_current_user_id

router = APIRouter()

@router.get("", response_model=List[ConversationResponse])
async def get_conversations(
    current_user_id: str = Depends(get_current_user_id)
):
    conversations = await message_service.get_conversations(current_user_id)
    return conversations

@router.get("/{user_id}", response_model=List[MessageResponse])
async def get_messages(
    user_id: str,
    limit: int = Query(50, le=100),
    current_user_id: str = Depends(get_current_user_id)
):
    messages = await message_service.get_messages_with_user(current_user_id, user_id, limit)
    return messages

@router.post("", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    message = await message_service.send_message(
        sender_id=current_user_id,
        receiver_id=message_data.receiver_id,
        content=message_data.content,
        media_url=message_data.media_url
    )
    
    if not message:
        raise HTTPException(status_code=500, detail="Failed to send message")
    
    return message
