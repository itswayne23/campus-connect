from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.user import UserCreate, TokenResponse, LoginRequest, RefreshRequest, UserResponse
from app.services.user_service import user_service
from app.core.security import decode_token, create_access_token, create_refresh_token
from app.api.deps import get_current_user_id

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing_users = user_service.supabase.table("profiles").select("id").eq("email", user_data.email).execute()
    if existing_users.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    existing_usernames = user_service.supabase.table("profiles").select("id").eq("username", user_data.username).execute()
    if existing_usernames.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    try:
        result = await user_service.create_user(user_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    return TokenResponse(
        access_token=create_access_token({"sub": result["id"]}),
        refresh_token=create_refresh_token({"sub": result["id"]}),
        user=result
    )

@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest):
    result = await user_service.authenticate_user(login_data.email, login_data.password)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    return result

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_data: RefreshRequest):
    payload = decode_token(refresh_data.refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    user = await user_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return TokenResponse(
        access_token=create_access_token({"sub": user_id}),
        refresh_token=create_refresh_token({"sub": user_id}),
        user=user
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user(current_user_id: str = Depends(get_current_user_id)):
    user = await user_service.get_user_by_id(current_user_id, current_user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.post("/logout")
async def logout(current_user_id: str = Depends(get_current_user_id)):
    return {"message": "Successfully logged out"}
