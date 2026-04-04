import { useFeed } from '@/hooks/use-posts'
import { PostComposer } from '@/components/feed/post-composer'
import { PostCard } from '@/components/feed/post-card'
import { StoriesBar } from '@/components/stories/stories-bar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Sparkles } from 'lucide-react'

export function HomePage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFeed()

  const allPosts = data?.pages.flatMap((page) => page.posts) || []

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Card className="p-4 shadow-md border-0">
        <StoriesBar />
      </Card>

      <Card className="overflow-hidden shadow-lg border-0">
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Home Feed</h2>
              <p className="text-xs text-gray-500">See posts from people you follow</p>
            </div>
          </div>
        </div>
        <PostComposer />
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : allPosts.length === 0 ? (
        <Card className="p-12 text-center shadow-lg border-0">
          <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Your feed is empty</h3>
          <p className="text-gray-500 mb-4">Follow some people to see their posts here!</p>
          <Button asChild>
            <a href="/explore">Explore People</a>
          </Button>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {allPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center py-6">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="rounded-full px-8"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading more...
                  </>
                ) : (
                  'Load More Posts'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
