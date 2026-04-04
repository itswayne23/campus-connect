from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List
from app.schemas.message_enhancements import (
    MessageReactionCreate,
    MessageReactionResponse,
    TypingStatusUpdate,
    TypingStatusResponse
)
from app.api.deps import get_current_user_id

router = APIRouter()


def get_service_client():
    from app.core import get_service_client as get_client
    return get_client()


@router.post("/reactions", response_model=MessageReactionResponse)
async def add_reaction(
    reaction_data: MessageReactionCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    existing = service.table("message_reactions").select("*").eq("message_id", reaction_data.message_id).eq("user_id", current_user_id).execute()
    
    if existing.data:
        if existing.data[0]["emoji"] == reaction_data.emoji:
            service.table("message_reactions").delete().eq("id", existing.data[0]["id"]).execute()
            return {"message": "Reaction removed", "removed": True}
        
        service.table("message_reactions").update({"emoji": reaction_data.emoji}).eq("id", existing.data[0]["id"]).execute()
        reaction_id = existing.data[0]["id"]
    else:
        result = service.table("message_reactions").insert({
            "message_id": reaction_data.message_id,
            "user_id": current_user_id,
            "emoji": reaction_data.emoji
        }).execute()
        reaction_id = result.data[0]["id"] if result.data else reaction_id
    
    reaction = service.table("message_reactions").select("*").eq("id", reaction_id).execute()
    
    return {
        "id": reaction.data[0]["id"],
        "message_id": reaction.data[0]["message_id"],
        "user_id": reaction.data[0]["user_id"],
        "emoji": reaction.data[0]["emoji"],
        "created_at": reaction.data[0]["created_at"]
    }


@router.get("/{message_id}/reactions", response_model=List[MessageReactionResponse])
async def get_reactions(
    message_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    reactions = service.table("message_reactions").select("*").eq("message_id", message_id).execute()
    
    return [
        MessageReactionResponse(
            id=r["id"],
            message_id=r["message_id"],
            user_id=r["user_id"],
            emoji=r["emoji"],
            created_at=r["created_at"]
        )
        for r in reactions.data
    ]


@router.post("/typing")
async def update_typing_status(
    status_data: TypingStatusUpdate,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    existing = service.table("typing_indicators").select("*").eq("user_id", current_user_id).eq("conversation_with", status_data.conversation_with).execute()
    
    if existing.data:
        service.table("typing_indicators").update({
            "is_typing": status_data.is_typing,
            "updated_at": "now()"
        }).eq("id", existing.data[0]["id"]).execute()
    else:
        service.table("typing_indicators").insert({
            "user_id": current_user_id,
            "conversation_with": status_data.conversation_with,
            "is_typing": status_data.is_typing
        }).execute()
    
    return {"success": True, "is_typing": status_data.is_typing}


@router.get("/{user_id}/typing", response_model=List[TypingStatusResponse])
async def get_typing_status(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    typing = service.table("typing_indicators").select("*").eq("conversation_with", current_user_id).eq("is_typing", True).execute()
    
    result = []
    for t in typing.data:
        profile = service.table("profiles").select("username").eq("id", t["user_id"]).execute()
        if profile.data:
            result.append(TypingStatusResponse(
                user_id=t["user_id"],
                username=profile.data[0]["username"],
                is_typing=t["is_typing"]
            ))
    
    return result


@router.post("/mark-read")
async def mark_messages_read(
    sender_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    service.table("messages").update({
        "is_read": True,
        "read_at": "now()"
    }).eq("sender_id", sender_id).eq("receiver_id", current_user_id).eq("is_read", False).execute()
    
    return {"success": True}


@router.get("/conversations/{user_id}/status")
async def get_read_status(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    last_message = service.table("messages").select("*").eq("sender_id", user_id).eq("receiver_id", current_user_id).order("created_at", desc=True).limit(1).execute()
    
    if not last_message.data:
        return {"is_read": None}
    
    return {
        "is_read": last_message.data[0].get("is_read", False),
        "read_at": last_message.data[0].get("read_at")
    }
