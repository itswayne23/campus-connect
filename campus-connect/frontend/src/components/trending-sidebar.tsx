import { Link } from 'react-router-dom'
import { useTrending } from '@/hooks/use-trending'
import { TrendingUp, Loader2 } from 'lucide-react'

export function TrendingSidebar() {
  const { data, isLoading } = useTrending(5)

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5" />
          <h3 className="font-semibold">Trending</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Trending Topics</h3>
      </div>
      
      {data?.topics && data.topics.length > 0 ? (
        <div className="space-y-3">
          {data.topics.map((topic) => (
            <Link
              key={topic.hashtag}
              to={`/explore?hashtag=${topic.hashtag}`}
              className="block group"
            >
              <div className="flex items-center justify-between">
                <span className="text-primary font-medium">#{topic.hashtag}</span>
                <span className="text-xs text-muted-foreground">
                  {topic.post_count} posts
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No trending topics yet</p>
      )}

      {data?.categories && data.categories.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Popular Categories</h4>
          <div className="flex flex-wrap gap-2">
            {data.categories.slice(0, 5).map((category) => (
              <Link
                key={category.name}
                to={`/explore?category=${category.name}`}
                className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full hover:bg-secondary/80"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
