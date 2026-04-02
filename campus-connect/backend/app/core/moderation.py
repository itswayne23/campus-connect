import httpx
from typing import Dict, Any
from .config import settings

MODERATION_API_URL = "https://api-inference.huggingface.co/models/facebook/roberta-hate-speech-dectector"

class ModerationService:
    def __init__(self):
        self.api_key = settings.HUGGINGFACE_API_KEY
        self.api_url = MODERATION_API_URL
    
    async def check_content(self, text: str) -> Dict[str, Any]:
        if not self.api_key:
            return {"flagged": False, "confidence": 0, "categories": {}}
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={"inputs": text}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    labels = result[0] if isinstance(result, list) else result
                    
                    hate_score = 0
                    for label in labels:
                        if label["label"] == "hate":
                            hate_score = label["score"]
                    
                    return {
                        "flagged": hate_score > 0.7,
                        "confidence": hate_score,
                        "categories": {label["label"]: label["score"] for label in labels}
                    }
                else:
                    return {"flagged": False, "confidence": 0, "categories": {}, "error": "API error"}
        except Exception as e:
            return {"flagged": False, "confidence": 0, "categories": {}, "error": str(e)}

moderation_service = ModerationService()
