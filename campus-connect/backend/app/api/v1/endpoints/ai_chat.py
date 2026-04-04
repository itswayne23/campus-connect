from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.api.deps import get_current_user, get_supabase
from app.schemas.ai_chat import AIChatRequest, AIChatResponse, AIChatSessionListResponse, AIChatMessageResponse
from app.services.ai_chat_service import AIChatService

router = APIRouter()


@router.post("/chat", response_model=AIChatResponse)
async def send_chat_message(
    request: AIChatRequest,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = AIChatService(supabase)
    result = await service.send_message(current_user["id"], request.message, request.session_id)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to send message")
    return AIChatResponse(
        session_id=result["session_id"],
        user_message=AIChatMessageResponse(**result["user_message"]),
        assistant_message=AIChatMessageResponse(**result["assistant_message"])
    )


@router.get("/sessions", response_model=list[AIChatSessionListResponse])
async def get_chat_sessions(
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = AIChatService(supabase)
    sessions = await service.get_user_sessions(current_user["id"])
    return sessions


@router.get("/sessions/{session_id}")
async def get_chat_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = AIChatService(supabase)
    session = await service.get_session(current_user["id"], session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/sessions")
async def create_chat_session(
    title: str = Query("New Chat"),
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = AIChatService(supabase)
    session = await service.create_session(current_user["id"], title)
    return session


@router.delete("/sessions/{session_id}")
async def delete_chat_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = AIChatService(supabase)
    success = await service.delete_session(current_user["id"], session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True}
