from typing import Optional, List
from supabase import Client
from app.core import get_supabase, get_service_client, get_password_hash, verify_password, create_access_token, create_refresh_token
from app.schemas.user import UserCreate, UserUpdate, UserResponse

class UserService:
    def __init__(self):
        self.supabase: Client = get_supabase()
    
    async def create_user(self, user_data: UserCreate) -> dict:
        service_client = get_service_client()
        
        hashed_password = get_password_hash(user_data.password)
        
        try:
            user = service_client.auth.admin.create_user({
                "email": user_data.email,
                "password": user_data.password,
                "email_confirm": True,
                "user_metadata": {
                    "username": user_data.username
                }
            })
        except Exception as auth_error:
            error_msg = str(auth_error)
            if "already been registered" in error_msg.lower() or "user_already_exists" in error_msg.lower():
                raise Exception("Email already registered")
            raise Exception(f"Failed to create auth user: {error_msg}")
        
        try:
            service_client.table("profiles").upsert({
                "id": user.user.id,
                "email": user_data.email,
                "username": user_data.username,
                "password_hash": hashed_password,
                "avatar_url": None,
                "bio": None,
                "university": None,
                "followers_count": 0,
                "following_count": 0,
                "posts_count": 0
            }).execute()
        except Exception as profile_error:
            error_msg = str(profile_error)
            if "23505" in error_msg:
                pass
            else:
                raise Exception(f"Failed to update profile: {profile_error}")
        
        return await self._build_user_response(user.user.id)
    
    async def authenticate_user(self, email: str, password: str) -> Optional[dict]:
        try:
            auth_response = self.supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if auth_response.user:
                access_token = create_access_token({"sub": auth_response.user.id})
                refresh_token = create_refresh_token({"sub": auth_response.user.id})
                
                return {
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "bearer",
                    "user": await self._build_user_response(auth_response.user.id)
                }
        except Exception as e:
            return None
        
        return None
    
    async def get_user_by_id(self, user_id: str, current_user_id: Optional[str] = None) -> Optional[dict]:
        response = self.supabase.table("profiles").select("*").eq("id", user_id).execute()
        
        if response.data:
            return await self._build_user_response(user_id, current_user_id)
        
        return None
    
    async def update_user(self, user_id: str, user_data: UserUpdate) -> Optional[dict]:
        service_client = get_service_client()
        
        update_data = user_data.model_dump(exclude_unset=True)
        
        if update_data:
            service_client.table("profiles").update(update_data).eq("id", user_id).execute()
        
        return await self._build_user_response(user_id)
    
    async def delete_user(self, user_id: str) -> bool:
        service_client = get_service_client()
        
        service_client.table("profiles").delete().eq("id", user_id).execute()
        service_client.auth.admin.delete_user(user_id)
        
        return True
    
    async def search_users(self, query: str, current_user_id: str) -> List[dict]:
        response = self.supabase.table("profiles").select("*").ilike("username", f"%{query}%").execute()
        
        users = []
        for user in response.data:
            users.append(await self._build_user_response(user["id"], current_user_id))
        
        return users
    
    async def get_user_posts_count(self, user_id: str) -> int:
        response = self.supabase.table("posts").select("id", count="exact").eq("author_id", user_id).eq("status", "approved").execute()
        return response.count or 0
    
    async def get_followers_count(self, user_id: str) -> int:
        response = self.supabase.table("follows").select("*", count="exact").eq("following_id", user_id).execute()
        return response.count or 0
    
    async def get_following_count(self, user_id: str) -> int:
        response = self.supabase.table("follows").select("*", count="exact").eq("follower_id", user_id).execute()
        return response.count or 0
    
    async def is_following(self, follower_id: str, following_id: str) -> bool:
        response = self.supabase.table("follows").select("*").eq("follower_id", follower_id).eq("following_id", following_id).execute()
        return len(response.data) > 0
    
    async def block_user(self, blocker_id: str, blocked_id: str) -> dict:
        service_client = get_service_client()
        
        if blocker_id == blocked_id:
            return {"success": False, "error": "Cannot block yourself"}
        
        existing = self.supabase.table("blocks").select("*").eq("blocker_id", blocker_id).eq("blocked_id", blocked_id).execute()
        if existing.data:
            return {"success": False, "error": "User already blocked"}
        
        service_client.table("blocks").insert({
            "blocker_id": blocker_id,
            "blocked_id": blocked_id
        }).execute()
        
        self.supabase.table("follows").delete().eq("follower_id", blocker_id).eq("following_id", blocked_id).execute()
        self.supabase.table("follows").delete().eq("follower_id", blocked_id).eq("following_id", blocker_id).execute()
        
        return {"success": True}
    
    async def unblock_user(self, blocker_id: str, blocked_id: str) -> dict:
        service_client = get_service_client()
        
        service_client.table("blocks").delete().eq("blocker_id", blocker_id).eq("blocked_id", blocked_id).execute()
        
        return {"success": True}
    
    async def is_blocked(self, blocker_id: str, blocked_id: str) -> bool:
        response = self.supabase.table("blocks").select("*").eq("blocker_id", blocker_id).eq("blocked_id", blocked_id).execute()
        return len(response.data) > 0
    
    async def mute_user(self, muter_id: str, muted_id: str) -> dict:
        service_client = get_service_client()
        
        if muter_id == muted_id:
            return {"success": False, "error": "Cannot mute yourself"}
        
        existing = self.supabase.table("mutes").select("*").eq("muter_id", muter_id).eq("muted_id", muted_id).execute()
        if existing.data:
            return {"success": False, "error": "User already muted"}
        
        service_client.table("mutes").insert({
            "muter_id": muter_id,
            "muted_id": muted_id
        }).execute()
        
        return {"success": True}
    
    async def unmute_user(self, muter_id: str, muted_id: str) -> dict:
        service_client = get_service_client()
        
        service_client.table("mutes").delete().eq("muter_id", muter_id).eq("muted_id", muted_id).execute()
        
        return {"success": True}
    
    async def is_muted(self, muter_id: str, muted_id: str) -> bool:
        response = self.supabase.table("mutes").select("*").eq("muter_id", muter_id).eq("muted_id", muted_id).execute()
        return len(response.data) > 0
    
    async def get_blocked_users(self, user_id: str) -> List[dict]:
        response = self.supabase.table("blocks").select("blocked_id, profiles(id, username, avatar_url)").eq("blocker_id", user_id).execute()
        return response.data
    
    async def get_muted_users(self, user_id: str) -> List[dict]:
        response = self.supabase.table("mutes").select("muted_id, profiles(id, username, avatar_url)").eq("muter_id", user_id).execute()
        return response.data
    
    async def _build_user_response(self, user_id: str, current_user_id: Optional[str] = None) -> dict:
        response = self.supabase.table("profiles").select("*").eq("id", user_id).execute()
        
        if not response.data:
            return None
        
        user = response.data[0]
        is_own = current_user_id == user_id if current_user_id else False
        
        followers_count = await self.get_followers_count(user_id)
        following_count = await self.get_following_count(user_id)
        posts_count = await self.get_user_posts_count(user_id)
        is_following = await self.is_following(current_user_id, user_id) if current_user_id and not is_own else False
        is_blocked = await self.is_blocked(current_user_id, user_id) if current_user_id else False
        is_muted = await self.is_muted(current_user_id, user_id) if current_user_id else False
        
        return {
            "id": user["id"],
            "email": user.get("email", ""),
            "username": user.get("username", ""),
            "avatar_url": user.get("avatar_url"),
            "bio": user.get("bio"),
            "university": user.get("university"),
            "followers_count": followers_count,
            "following_count": following_count,
            "posts_count": posts_count,
            "is_following": is_following,
            "is_blocked": is_blocked,
            "is_muted": is_muted,
            "is_own_profile": is_own,
            "created_at": user.get("created_at")
        }

user_service = UserService()
