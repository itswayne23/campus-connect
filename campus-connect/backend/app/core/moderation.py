import httpx
import re
from typing import Dict, Any, List
from .config import settings

MODERATION_API_URL = "https://api-inference.huggingface.co/models/facebook/roberta-hate-speech-dectector-davinci-revision-4da03a11"

SPAM_PATTERNS = [
    r'\b(buy|sell|offer|discount|free|winner|congratulations|click here|act now|limited time)\b',
    r'(https?://\S+)',
    r'(http?://\S+)',
    r'\b\d{10,}\b',
    r'(earn money|make money|work from home|income|profit)\b',
    r'(lottery|prize|cash prize|reward)\b',
    r'(crypto|bitcoin|investment opportunity)\b',
]

EXCESSIVE_CAPS_THRESHOLD = 0.5
EXCESSIVE_PUNCTUATION_THRESHOLD = 0.3

class ModerationService:
    def __init__(self):
        self.api_key = settings.HUGGINGFACE_API_KEY
        self.api_url = MODERATION_API_URL
        self.spam_patterns = [re.compile(p, re.IGNORECASE) for p in SPAM_PATTERNS]
    
    def check_spam_patterns(self, text: str) -> Dict[str, Any]:
        spam_score = 0
        matched_patterns = []
        
        for pattern in self.spam_patterns:
            matches = pattern.findall(text)
            if matches:
                spam_score += len(matches) * 0.2
                matched_patterns.extend(matches)
        
        words = text.split()
        if len(words) > 0:
            caps_words = [w for w in words if w.isupper() and len(w) > 2]
            if len(caps_words) / len(words) > EXCESSIVE_CAPS_THRESHOLD:
                spam_score += 0.3
            
            punctuation_count = sum(1 for c in text if c in '!?')
            if punctuation_count / len(text) > EXCESSIVE_PUNCTUATION_THRESHOLD:
                spam_score += 0.2
        
        emoji_count = len(re.findall(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF]', text))
        if emoji_count > 5:
            spam_score += 0.2
        
        if len(text) < 10 and len(matched_patterns) > 0:
            spam_score += 0.3
        
        return {
            "is_spam": spam_score > 0.5,
            "spam_score": min(spam_score, 1.0),
            "matched_patterns": matched_patterns[:5]
        }
    
    async def check_content(self, text: str) -> Dict[str, Any]:
        if not text or len(text.strip()) == 0:
            return {"flagged": False, "confidence": 0, "categories": {}, "is_spam": False, "spam_score": 0}
        
        spam_result = self.check_spam_patterns(text)
        
        if not self.api_key:
            return {
                "flagged": spam_result["is_spam"],
                "confidence": spam_result["spam_score"],
                "categories": {"spam": spam_result["is_spam"]},
                "is_spam": spam_result["is_spam"],
                "spam_score": spam_result["spam_score"]
            }
        
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
                        return {
                            "flagged": spam_result["is_spam"],
                            "confidence": spam_result["spam_score"],
                            "categories": {"spam": spam_result["is_spam"]},
                            "is_spam": spam_result["is_spam"],
                            "spam_score": spam_result["spam_score"]
                        }
                    
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
                    
                    combined_score = max(hate_score, spam_result["spam_score"])
                    is_flagged = hate_score > 0.7 or spam_result["is_spam"]
                    
                    return {
                        "flagged": is_flagged,
                        "confidence": combined_score,
                        "categories": {
                            "hate_speech": hate_score > 0.7,
                            "spam": spam_result["is_spam"]
                        },
                        "is_spam": spam_result["is_spam"],
                        "spam_score": spam_result["spam_score"],
                        "hate_score": hate_score
                    }
                elif response.status_code == 503:
                    return {
                        "flagged": spam_result["is_spam"],
                        "confidence": spam_result["spam_score"],
                        "categories": {"spam": spam_result["is_spam"]},
                        "is_spam": spam_result["is_spam"],
                        "spam_score": spam_result["spam_score"],
                        "error": "Model loading"
                    }
                else:
                    return {
                        "flagged": spam_result["is_spam"],
                        "confidence": spam_result["spam_score"],
                        "categories": {"spam": spam_result["is_spam"]},
                        "is_spam": spam_result["is_spam"],
                        "spam_score": spam_result["spam_score"],
                        "error": f"API error: {response.status_code}"
                    }
        except Exception as e:
            return {
                "flagged": spam_result["is_spam"],
                "confidence": spam_result["spam_score"],
                "categories": {"spam": spam_result["is_spam"]},
                "is_spam": spam_result["is_spam"],
                "spam_score": spam_result["spam_score"],
                "error": str(e)
            }

moderation_service = ModerationService()
