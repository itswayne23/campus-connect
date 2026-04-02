import httpx
from typing import Dict, Any
from .config import settings

MODERATION_API_URL = "https://api-inference.huggingface.co/models/facebook/roberta-hate-speech-dectector-davinci-revision-4da03a11"

class ModerationService:
    def __init__(self):
        self.api_key = settings.HUGGINGFACE_API_KEY
        self.api_url = MODERATION_API_URL
    
    async def check_content(self, text: str) -> Dict[str, Any]:
        if not self.api_key:
            return {"flagged": False, "confidence": 0, "categories": {}}
        
        if not text or len(text.strip()) == 0:
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
                    
                    if isinstance(result, list) and len(result) > 0:
                        labels = result[0]
                    elif isinstance(result, dict) and "outputs" in result:
                        labels = result["outputs"][0]
                    else:
                        return {"flagged": False, "confidence": 0, "categories": {}}
                    
                    hate_score = 0
                    if isinstance(labels, list):
                        for label in labels:
                            if isinstance(label, dict) and label.get("label") == "hate":
                                hate_score = label.get("score", 0)
                    elif isinstance(labels, dict):
                        hate = labels.get("hate", labels.get("label 1", 0))
                        if isinstance(hate, dict):
                            hate_score = hate.get("score", 0)
                        else:
                            hate_score = hate
                    
                    return {
                        "flagged": hate_score > 0.7,
                        "confidence": hate_score,
                        "categories": {}
                    }
                elif response.status_code == 503:
                    return {"flagged": False, "confidence": 0, "categories": {}, "error": "Model loading"}
                else:
                    return {"flagged": False, "confidence": 0, "categories": {}, "error": f"API error: {response.status_code}"}
        except Exception as e:
            return {"flagged": False, "confidence": 0, "categories": {}, "error": str(e)}

moderation_service = ModerationService()
