import { useSearchParams } from 'react-router-dom'
import { useExploreFeed } from '@/hooks/use-posts'
import { PostCard } from '@/components/feed/post-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Hash, TrendingUp } from 'lucide-react'

const TRENDING_HASHTAGS = [
  { tag: 'campuslife', count: 156 },
  { tag: 'student', count: 142 },
  { tag: 'university', count: 128 },
  { tag: 'study', count: 95 },
  { tag: 'exam', count: 87 },
  { tag: 'college', count: 76 },
  { tag: 'friends', count: 65 },
  { tag: 'food', count: 54 },
]

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedTag = searchParams.get('tag')
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useExploreFeed()

  const allPosts = data?.pages.flatMap((page) => page.posts) || []

  const handleTagClick = (tag: string) => {
    setSearchParams({ tag })
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Explore</h1>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Hash className="h-5 w-5 text-blue-500" />
          <h2 className="font-semibold">Trending Hashtags</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {TRENDING_HASHTAGS.map((item) => (
            <Button
              key={item.tag}
              variant={selectedTag === item.tag ? 'secondary' : 'outline'}
              size="sm"
              className="rounded-full"
              onClick={() => handleTagClick(item.tag)}
            >
              #{item.tag}
              <span className="ml-1 text-xs text-gray-400">({item.count})</span>
            </Button>
          ))}
        </div>
      </Card>

      {selectedTag && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-blue-500" />
              <span className="font-semibold">#{selectedTag}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSearchParams({})}>
              Clear
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : allPosts.length === 0 ? (
        <Card className="p-8 text-center">
          <Hash className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {selectedTag ? `No posts found with #${selectedTag}` : 'No posts to explore yet'}
          </p>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {allPosts
              .filter(post => {
                if (!selectedTag) return true
                const content = post.content.toLowerCase()
                return content.includes(`#${selectedTag.toLowerCase()}`)
              })
              .map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
