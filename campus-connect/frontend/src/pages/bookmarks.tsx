import { useBookmarks } from '@/hooks/use-posts'
import { PostCard } from '@/components/feed/post-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Bookmark } from 'lucide-react'
import { Link } from 'react-router-dom'

export function BookmarksPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useBookmarks()

  const allPosts = data?.pages.flatMap((page) => page.posts) || []

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Card className="overflow-hidden shadow-lg border-0">
        <div className="p-4 border-b bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
              <Bookmark className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Saved Posts</h2>
              <p className="text-xs text-gray-500">Posts you've bookmarked</p>
            </div>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        </div>
      ) : allPosts.length === 0 ? (
        <Card className="p-12 text-center shadow-lg border-0">
          <div className="h-16 w-16 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bookmark className="h-8 w-8 text-yellow-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No saved posts yet</h3>
          <p className="text-gray-500 mb-4">Save posts to view them later!</p>
          <Link to="/">
            <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
              Explore Posts
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          {allPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          
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
