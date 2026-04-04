from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.api.deps import get_current_user, get_supabase
from app.schemas.study_partner import StudyPartnerRequestCreate, StudyPartnerRequestResponse, StudyMatchResponse, StudyPartnerSearchParams
from app.services.study_partner_service import StudyPartnerService

router = APIRouter()


@router.post("/", response_model=StudyPartnerRequestResponse)
async def create_study_request(
    request: StudyPartnerRequestCreate,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = StudyPartnerService(supabase)
    result = await service.create_request(current_user["id"], request.model_dump())
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create request")
    return result


@router.get("/", response_model=list[StudyPartnerRequestResponse])
async def get_study_requests(
    course: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    preferred_method: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = StudyPartnerService(supabase)
    filters = {}
    if course:
        filters["course"] = course
    if topic:
        filters["topic"] = topic
    if preferred_method:
        filters["preferred_method"] = preferred_method
    return await service.get_requests(filters, limit)


@router.get("/my-requests", response_model=list[StudyPartnerRequestResponse])
async def get_my_requests(
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = StudyPartnerService(supabase)
    return await service.get_user_requests(current_user["id"])


@router.put("/{request_id}", response_model=StudyPartnerRequestResponse)
async def update_study_request(
    request_id: str,
    request: StudyPartnerRequestCreate,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = StudyPartnerService(supabase)
    result = await service.update_request(current_user["id"], request_id, request.model_dump())
    if not result:
        raise HTTPException(status_code=404, detail="Request not found")
    return result


@router.delete("/{request_id}")
async def delete_study_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = StudyPartnerService(supabase)
    success = await service.delete_request(current_user["id"], request_id)
    if not success:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"success": True}


@router.post("/match/{request_id}", response_model=StudyMatchResponse)
async def create_study_match(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = StudyPartnerService(supabase)
    result = await service.create_match(current_user["id"], request_id)
    if not result:
        raise HTTPException(status_code=400, detail="Could not create match")
    return result


@router.get("/matches", response_model=list[StudyMatchResponse])
async def get_my_matches(
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = StudyPartnerService(supabase)
    return await service.get_user_matches(current_user["id"])
