import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFollowedHashtags, useFollowHashtag, useHashtagPosts } from '@/hooks/use-social'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Hash, Plus, Check } from 'lucide-react'
import { PostCard } from '@/components/feed/post-card'
import { formatDate } from '@/lib/utils'

export function HashtagsPage() {
  const [searchHashtag, setSearchHashtag] = useState('')
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null)
  const { data: followedHashtags, isLoading } = useFollowedHashtags()
  const followHashtag = useFollowHashtag()
  const { data: hashtagPosts, isLoading: loadingPosts } = useHashtagPosts(selectedHashtag || '')
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchHashtag.trim()) {
      setSelectedHashtag(searchHashtag.trim().toLowerCase().replace('#', ''))
    }
  }

  const handleFollowToggle = (hashtag: string, isFollowing: boolean) => {
    followHashtag.mutate(hashtag)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Hash className="h-6 w-6" />
        Hashtags
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Following</CardTitle>
        </CardHeader>
        <CardContent>
          {followedHashtags && followedHashtags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {followedHashtags.map((tag) => (
                <Button
                  key={tag.id}
                  variant={selectedHashtag === tag.hashtag ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedHashtag(tag.hashtag)}
                  className="gap-1"
                >
                  <Hash className="h-4 w-4" />
                  {tag.hashtag}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">You're not following any hashtags yet</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Explore Hashtags</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search hashtags..."
              value={searchHashtag}
              onChange={(e) => setSearchHashtag(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!searchHashtag.trim()}>
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {selectedHashtag && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                <CardTitle>#{selectedHashtag}</CardTitle>
              </div>
              <Button
                variant={followedHashtags?.some(t => t.hashtag === selectedHashtag) ? 'outline' : 'default'}
                size="sm"
                onClick={() => handleFollowToggle(selectedHashtag, followedHashtags?.some(t => t.hashtag === selectedHashtag))}
              >
                {followedHashtags?.some(t => t.hashtag === selectedHashtag) ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Following
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Follow
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : hashtagPosts && hashtagPosts.length > 0 ? (
              <div className="space-y-4">
                {hashtagPosts.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No posts found with this hashtag
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Popular Hashtags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['campus', 'study', 'exam', 'university', 'college', 'student', 'academic', 'sports', 'events', 'clubs'].map((tag) => (
              <Button
                key={tag}
                variant="outline"
                size="sm"
                onClick={() => setSelectedHashtag(tag)}
                className="gap-1"
              >
                <Hash className="h-4 w-4" />
                {tag}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
