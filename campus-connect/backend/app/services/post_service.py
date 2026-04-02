from typing import Optional, List
import random
from supabase import Client
from app.core import get_supabase, get_service_client, moderation_service
from app.schemas.post import PostCreate, PostUpdate, PostResponse, PostCategory, PostStatus

ANONYMOUS_NAMES = [
    ("Anonymous Fox", "🦊"),
    ("Mystery Owl", "🦉"),
    ("Silent Panda", "🐼"),
    ("Hidden Eagle", "🦅"),
    ("Secret Rabbit", "🐰"),
    ("Masked Tiger", "🐯"),
    ("Shadow Wolf", "🐺"),
    ("Quiet Dolphin", "🐬"),
    ("Stealth Hawk", "🦇"),
    ("Covert Bear", "🐻"),
    ("Enigma Cat", "🐱"),
    ("Phantom Deer", "🦌"),
    ("Cryptic Dragon", "🐲"),
    ("Veiled Penguin", "🐧"),
    ("Camouflage Snake", "🐍"),
]

class PostService:
    def __init__(self):
        self.supabase: Client = get_supabase()
    
    def _generate_anonymous_name(self) -> str:
        name, emoji = random.choice(ANONYMOUS_NAMES)
        return f"{name} {emoji}"
    
    async def create_post(self, author_id: str, post_data: PostCreate) -> dict:
        service_client = get_service_client()
        
        anonymous_name = None
        status = PostStatus.APPROVED.value
        
        if post_data.is_anonymous:
            anonymous_name = self._generate_anonymous_name()
            
            moderation_result = await moderation_service.check_content(post_data.content)
            
            if moderation_result.get("flagged"):
                status = PostStatus.PENDING.value
        
        post_payload = {
            "author_id": author_id,
            "content": post_data.content,
            "media_urls": post_data.media_urls or [],
            "is_anonymous": post_data.is_anonymous,
            "anonymous_name": anonymous_name,
            "category": post_data.category.value if post_data.category else None,
            "status": status,
            "likes_count": 0,
            "comments_count": 0
        }
        
        response = service_client.table("posts").insert(post_payload).execute()
        
        if response.data:
            return await self.get_post_by_id(response.data[0]["id"], author_id)
        
        return None
    
    async def get_post_by_id(self, post_id: str, current_user_id: Optional[str] = None) -> Optional[dict]:
        response = self.supabase.table("posts").select("*").eq("id", post_id).execute()
        
        if not response.data:
            return None
        
        post = response.data[0]
        return await self._build_post_response(post, current_user_id)
    
    async def get_feed(self, user_id: str, cursor: Optional[str] = None, limit: int = 20) -> dict:
        following_response = self.supabase.table("follows").select("following_id").eq("follower_id", user_id).execute()
        following_ids = [f["following_id"] for f in following_response.data]
        following_ids.append(user_id)
        
        query = self.supabase.table("posts").select("*").eq("status", "approved")
        
        if following_ids:
            query = query.in_("author_id", following_ids)
        
        query = query.order("created_at", desc=True).limit(limit + 1)
        
        if cursor:
            query = query.lt("created_at", cursor)
        
        response = query.execute()
        
        has_more = len(response.data) > limit
        posts_data = response.data[:limit]
        
        posts = []
        for post in posts_data:
            posts.append(await self._build_post_response(post, user_id))
        
        next_cursor = posts_data[-1]["created_at"] if posts_data and has_more else None
        
        return {
            "posts": posts,
            "has_more": has_more,
            "next_cursor": next_cursor
        }
    
    async def get_anonymous_feed(self, category: Optional[str] = None, cursor: Optional[str] = None, limit: int = 20) -> dict:
        query = self.supabase.table("posts").select("*").eq("is_anonymous", True).eq("status", "approved")
        
        if category:
            query = query.eq("category", category)
        
        query = query.order("created_at", desc=True).limit(limit + 1)
        
        if cursor:
            query = query.lt("created_at", cursor)
        
        response = query.execute()
        
        has_more = len(response.data) > limit
        posts_data = response.data[:limit]
        
        posts = []
        for post in posts_data:
            posts.append(await self._build_post_response(post, None))
        
        next_cursor = posts_data[-1]["created_at"] if posts_data and has_more else None
        
        return {
            "posts": posts,
            "has_more": has_more,
            "next_cursor": next_cursor
        }
    
    async def get_explore_feed(self, current_user_id: str, cursor: Optional[str] = None, limit: int = 20) -> dict:
        query = self.supabase.table("posts").select("*").eq("status", "approved").order("likes_count", desc=True).limit(limit + 1)
        
        if cursor:
            query = query.lt("likes_count", int(cursor))
        
        response = query.execute()
        
        has_more = len(response.data) > limit
        posts_data = response.data[:limit]
        
        posts = []
        for post in posts_data:
            posts.append(await self._build_post_response(post, current_user_id))
        
        next_cursor = str(posts_data[-1]["likes_count"]) if posts_data and has_more else None
        
        return {
            "posts": posts,
            "has_more": has_more,
            "next_cursor": next_cursor
        }
    
    async def get_user_posts(self, user_id: str, current_user_id: str) -> List[dict]:
        response = self.supabase.table("posts").select("*").eq("author_id", user_id).eq("status", "approved").order("created_at", desc=True).execute()
        
        posts = []
        for post in response.data:
            posts.append(await self._build_post_response(post, current_user_id))
        
        return posts
    
    async def update_post(self, post_id: str, author_id: str, post_data: PostUpdate) -> Optional[dict]:
        service_client = get_service_client()
        
        update_data = post_data.model_dump(exclude_unset=True)
        
        if update_data:
            service_client.table("posts").update(update_data).eq("id", post_id).eq("author_id", author_id).execute()
        
        return await self.get_post_by_id(post_id, author_id)
    
    async def delete_post(self, post_id: str, author_id: str) -> bool:
        service_client = get_service_client()
        
        service_client.table("posts").delete().eq("id", post_id).eq("author_id", author_id).execute()
        
        return True
    
    async def like_post(self, post_id: str, user_id: str) -> dict:
        service_client = get_service_client()
        
        existing = self.supabase.table("likes").select("*").eq("post_id", post_id).eq("user_id", user_id).execute()
        
        if existing.data:
            service_client.table("likes").delete().eq("post_id", post_id).eq("user_id", user_id).execute()
            
            post = self.supabase.table("posts").select("likes_count").eq("id", post_id).execute()
            if post.data:
                new_count = max(0, post.data[0]["likes_count"] - 1)
                service_client.table("posts").update({"likes_count": new_count}).eq("id", post_id).execute()
            
            return {"success": True, "likes_count": new_count, "is_liked": False}
        
        service_client.table("likes").insert({"post_id": post_id, "user_id": user_id}).execute()
        
        post = self.supabase.table("posts").select("likes_count").eq("id", post_id).execute()
        if post.data:
            new_count = post.data[0]["likes_count"] + 1
            service_client.table("posts").update({"likes_count": new_count}).eq("id", post_id).execute()
            
            post_data = self.supabase.table("posts").select("author_id").eq("id", post_id).execute()
            if post_data.data and post_data.data[0]["author_id"]:
                self._create_notification(
                    post_data.data[0]["author_id"],
                    "like",
                    user_id,
                    post_id
                )
        
        return {"success": True, "likes_count": new_count, "is_liked": True}
    
    async def get_comments(self, post_id: str, current_user_id: Optional[str] = None) -> List[dict]:
        response = self.supabase.table("comments").select("*").eq("post_id", post_id).is_("parent_id", None).order("created_at", desc=True).execute()
        
        comments = []
        for comment in response.data:
            comments.append(await self._build_comment_response(comment, current_user_id))
        
        return comments
    
    async def create_comment(self, post_id: str, author_id: str, content: str, is_anonymous: bool = False, parent_id: Optional[str] = None) -> dict:
        service_client = get_service_client()
        
        anonymous_name = None
        if is_anonymous:
            anonymous_name = self._generate_anonymous_name()
        
        comment_data = {
            "post_id": post_id,
            "author_id": author_id,
            "content": content,
            "is_anonymous": is_anonymous,
            "anonymous_name": anonymous_name,
            "parent_id": parent_id
        }
        
        response = service_client.table("comments").insert(comment_data).execute()
        
        post = self.supabase.table("posts").select("comments_count", "author_id").eq("id", post_id).execute()
        if post.data:
            new_count = post.data[0]["comments_count"] + 1
            service_client.table("posts").update({"comments_count": new_count}).eq("id", post_id).execute()
            
            if post.data[0]["author_id"]:
                self._create_notification(
                    post.data[0]["author_id"],
                    "comment",
                    author_id,
                    post_id
                )
        
        if response.data:
            return await self._build_comment_response(response.data[0], author_id)
        
        return None
    
    def _create_notification(self, user_id: str, notification_type: str, actor_id: str, post_id: Optional[str] = None):
        try:
            service_client = get_service_client()
            
            notification_data = {
                "user_id": user_id,
                "type": notification_type,
                "actor_id": actor_id,
                "post_id": post_id,
                "is_read": False
            }
            
            service_client.table("notifications").insert(notification_data).execute()
        except Exception:
            pass
    
    async def _build_post_response(self, post: dict, current_user_id: Optional[str] = None) -> dict:
        author = None
        if post.get("author_id") and not post.get("is_anonymous"):
            user_response = self.supabase.table("profiles").select("id, username, avatar_url").eq("id", post["author_id"]).execute()
            if user_response.data:
                author = user_response.data[0]
        
        is_liked = False
        is_bookmarked = False
        if current_user_id and post.get("author_id"):
            like_response = self.supabase.table("likes").select("*").eq("post_id", post["id"]).eq("user_id", current_user_id).execute()
            is_liked = len(like_response.data) > 0
            
            bookmark_response = self.supabase.table("bookmarks").select("*").eq("post_id", post["id"]).eq("user_id", current_user_id).execute()
            is_bookmarked = len(bookmark_response.data) > 0
        
        return {
            "id": post["id"],
            "author_id": post.get("author_id"),
            "author": author,
            "content": post["content"],
            "media_urls": post.get("media_urls", []),
            "is_anonymous": post.get("is_anonymous", False),
            "anonymous_name": post.get("anonymous_name"),
            "category": post.get("category"),
            "likes_count": post.get("likes_count", 0),
            "comments_count": post.get("comments_count", 0),
            "is_liked": is_liked,
            "is_bookmarked": is_bookmarked,
            "created_at": post.get("created_at"),
            "updated_at": post.get("updated_at")
        }
    
    async def _build_comment_response(self, comment: dict, current_user_id: Optional[str] = None) -> dict:
        author = None
        if comment.get("author_id") and not comment.get("is_anonymous"):
            user_response = self.supabase.table("profiles").select("id, username, avatar_url").eq("id", comment["author_id"]).execute()
            if user_response.data:
                author = user_response.data[0]
        
        replies = []
        if not comment.get("parent_id"):
            replies_response = self.supabase.table("comments").select("*").eq("parent_id", comment["id"]).order("created_at", desc=True).execute()
            for reply in replies_response.data:
                replies.append(await self._build_comment_response(reply, current_user_id))
        
        return {
            "id": comment["id"],
            "post_id": comment["post_id"],
            "author_id": comment.get("author_id"),
            "author": author,
            "content": comment["content"],
            "is_anonymous": comment.get("is_anonymous", False),
            "anonymous_name": comment.get("anonymous_name"),
            "parent_id": comment.get("parent_id"),
            "replies": replies,
            "created_at": comment.get("created_at")
        }

post_service = PostService()
