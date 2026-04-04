from supabase import Client
from typing import Optional, List
from datetime import datetime
import os


class AIChatService:
    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def create_session(self, user_id: str, title: str = "New Chat") -> dict:
        data = {
            "user_id": user_id,
            "title": title,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        response = self.supabase.table("ai_chat_sessions").insert(data).execute()
        return response.data[0] if response.data else None

    async def get_user_sessions(self, user_id: str) -> List[dict]:
        response = self.supabase.table("ai_chat_sessions").select("*").eq("user_id", user_id).order("updated_at", desc=True).execute()
        
        results = []
        for session in response.data:
            messages_response = self.supabase.table("ai_chat_messages").select("message").eq("session_id", session["id"]).order("created_at", desc=True).limit(1).execute()
            preview = messages_response.data[0].get("message", "")[:50] if messages_response.data else ""
            session["preview"] = preview
            results.append(session)
        
        return results

    async def get_session(self, user_id: str, session_id: str) -> Optional[dict]:
        session_response = self.supabase.table("ai_chat_sessions").select("*").eq("id", session_id).eq("user_id", user_id).execute()
        
        if not session_response.data:
            return None
        
        session = session_response.data[0]
        
        messages_response = self.supabase.table("ai_chat_messages").select("*").eq("session_id", session_id).order("created_at").execute()
        session["messages"] = messages_response.data
        
        return session

    async def send_message(self, user_id: str, message: str, session_id: Optional[str] = None) -> dict:
        if not session_id:
            session = await self.create_session(user_id, message[:30])
            session_id = session["id"]
        else:
            session_response = self.supabase.table("ai_chat_sessions").select("*").eq("id", session_id).eq("user_id", user_id).execute()
            if not session_response.data:
                session = await self.create_session(user_id, message[:30])
                session_id = session["id"]
            else:
                session = session_response.data[0]
        
        user_message_data = {
            "session_id": session_id,
            "user_id": user_id,
            "message": message,
            "role": "user",
            "created_at": datetime.utcnow().isoformat()
        }
        user_message_response = self.supabase.table("ai_chat_messages").insert(user_message_data).execute()
        user_message = user_message_response.data[0] if user_message_response.data else None
        
        assistant_response = await self._get_ai_response(message, session.get("title", ""))
        
        assistant_message_data = {
            "session_id": session_id,
            "user_id": user_id,
            "message": assistant_response,
            "role": "assistant",
            "created_at": datetime.utcnow().isoformat()
        }
        assistant_message_response = self.supabase.table("ai_chat_messages").insert(assistant_message_data).execute()
        assistant_message = assistant_message_response.data[0] if assistant_message_response.data else None
        
        self.supabase.table("ai_chat_sessions").update({
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", session_id).execute()
        
        if not session.get("title") or session.get("title") == "New Chat":
            self.supabase.table("ai_chat_sessions").update({
                "title": message[:30] + "..." if len(message) > 30 else message
            }).eq("id", session_id).execute()
        
        return {
            "session_id": session_id,
            "user_message": user_message,
            "assistant_message": assistant_message
        }

    async def delete_session(self, user_id: str, session_id: str) -> bool:
        response = self.supabase.table("ai_chat_sessions").delete().eq("id", session_id).eq("user_id", user_id).execute()
        return len(response.data) > 0

    async def _get_ai_response(self, user_message: str, context: str = "") -> str:
        try:
            api_key = os.getenv("HUGGINGFACE_API_KEY")
            if not api_key:
                return self._get_default_response(user_message)
            
            from huggingface_hub import InferenceClient
            
            client = InferenceClient(api_key=api_key)
            
            prompt = self._build_prompt(user_message, context)
            
            response = client.chat_completion(
                messages=[{"role": "user", "content": prompt}],
                model="meta-llama/Llama-3.2-1B-Instruct",
                max_tokens=500
            )
            
            return response.choices[0].message.content
        except Exception as e:
            return self._get_default_response(user_message)

    def _build_prompt(self, message: str, context: str) -> str:
        return f"""You are Campus Connect AI Assistant, a helpful campus life assistant for students. You help with:
- Study tips and academic advice
- Campus resources and events
- Time management and productivity
- Mental health and wellness tips
- General student questions

Context: {context}
User: {message}
Assistant:"""

    def _get_default_response(self, message: str) -> str:
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["study", "exam", "test", "homework", "assignment"]):
            return "For studying effectively, try the Pomodoro technique (25 minutes study, 5 minutes break). Also, consider forming a study group with classmates. Would you like help finding study partners on Campus Connect?"
        
        if any(word in message_lower for word in ["stress", "anxiety", "mental health", "feeling", "emotion"]):
            return "Taking care of your mental health is important. Remember to take breaks, stay connected with friends, and don't hesitate to use campus counseling services. Would you like me to track your mood?"
        
        if any(word in message_lower for word in ["event", "activity", "club", "organization"]):
            return "Campus Connect has an Events page where you can find campus activities. Check out the Events tab to see what's happening on campus!"
        
        if any(word in message_lower for word in ["food", "eat", "restaurant", "cafeteria"]):
            return "Looking for food options? Check local campus maps or food delivery apps for nearby options. Many campuses also have great dining halls!"
        
        if any(word in message_lower for word in ["professor", "teacher", "course", "class"]):
            return "You can use our Professor Ratings feature to see reviews from other students. Check the Academics section for course reviews too!"
        
        return "I'm here to help! You can ask me about study tips, campus events, mental health resources, or use features like mood tracking and finding study partners. What would you like to know?"
