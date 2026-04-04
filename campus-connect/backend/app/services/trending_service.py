from supabase import create_client
from app.core.config import settings
from app.schemas.trending import TrendingResponse, TrendingTopic, TrendingCategory
from datetime import datetime, timedelta
import re
from collections import Counter

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

def extract_hashtags(content: str) -> list[str]:
    return re.findall(r'#(\w+)', content.lower())

async def get_trending(limit: int = 10) -> TrendingResponse:
    week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
    
    result = supabase.table('posts').select('content, category, likes_count, comments_count, created_at').eq('status', 'approved').gte('created_at', week_ago).execute()
    
    hashtag_counts = Counter()
    category_counts = {}
    
    for post in result.data:
        hashtags = extract_hashtags(post.get('content', ''))
        for tag in hashtags:
            if len(tag) >= 2:
                hashtag_counts[tag] += 1
        
        category = post.get('category')
        if category:
            if category not in category_counts:
                category_counts[category] = {'count': 0, 'likes': 0, 'comments': 0}
            category_counts[category]['count'] += 1
            category_counts[category]['likes'] += post.get('likes_count', 0)
            category_counts[category]['comments'] += post.get('comments_count', 0)
    
    topics = []
    for hashtag, count in hashtag_counts.most_common(limit):
        topics.append(TrendingTopic(
            hashtag=hashtag,
            post_count=count,
            trend_score=float(count),
            recent_posts=count
        ))
    
    categories = []
    for name, data in sorted(category_counts.items(), key=lambda x: x[1]['count'], reverse=True)[:limit]:
        trend_score = data['count'] + (data['likes'] * 0.5) + (data['comments'] * 0.3)
        categories.append(TrendingCategory(
            name=name,
            post_count=data['count'],
            trend_score=trend_score
        ))
    
    return TrendingResponse(
        topics=topics,
        categories=categories,
        last_updated=datetime.utcnow()
    )

async def search_hashtag(hashtag: str, limit: int = 20) -> list[dict]:
    pattern = f'%#{hashtag.lower()}%'
    result = supabase.table('posts').select('*, author:profiles!posts_author_id_fkey(*)').eq('status', 'approved').ilike('content', pattern).order('created_at', desc=True).limit(limit).execute()
    return result.data
