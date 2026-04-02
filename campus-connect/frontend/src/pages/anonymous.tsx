import { useState } from 'react'
import { useAnonymousFeed } from '@/hooks/use-posts'
import { AnonymousComposer } from '@/components/anonymous/anonymous-composer'
import { PostCard } from '@/components/feed/post-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, AlertTriangle, Lightbulb, MessageSquare, HelpCircle, Ghost } from 'lucide-react'
import type { PostCategory } from '@/types'

const categories = [
  { value: undefined, label: 'All', icon: Ghost },
  { value: 'complaint' as const, label: 'Complaints', icon: AlertTriangle },
  { value: 'suggestion' as const, label: 'Suggestions', icon: Lightbulb },
  { value: 'experience' as const, label: 'Experiences', icon: MessageSquare },
  { value: 'qna' as const, label: 'Q&A', icon: HelpCircle },
]

export function AnonymousPage() {
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | undefined>(undefined)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useAnonymousFeed(selectedCategory)

  const allPosts = data?.pages.flatMap((page) => page.posts) || []

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Ghost className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Anonymous Channel</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Share your thoughts, complaints, or experiences without revealing your identity.
          Your privacy is our priority.
        </p>
      </div>

      <AnonymousComposer />

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <Button
            key={cat.label}
            variant={selectedCategory === cat.value ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat.value)}
            className="gap-2 whitespace-nowrap"
          >
            <cat.icon className="h-4 w-4" />
            {cat.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : allPosts.length === 0 ? (
        <Card className="p-8 text-center">
          <Ghost className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No anonymous posts yet. Be the first to share!</p>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {allPosts.map((post) => (
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
