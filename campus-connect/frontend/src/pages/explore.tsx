import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PostCard } from '@/components/feed/post-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, Search, TrendingUp, Hash, Calendar, Filter, X } from 'lucide-react'
import { api } from '@/lib/api'
import type { Post, PostFeedResponse } from '@/types'
import { useQuery } from '@tanstack/react-query'

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'complaint', label: 'Complaints' },
  { value: 'suggestion', label: 'Suggestions' },
  { value: 'experience', label: 'Experiences' },
  { value: 'qna', label: 'Q&A' },
  { value: 'general', label: 'General' },
]

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'popular', label: 'Most Liked' },
  { value: 'trending', label: 'Most Discussed' },
]

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
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedHashtag, setSelectedHashtag] = useState(searchParams.get('tag') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'recent')
  const [posts, setPosts] = useState<Post[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedHashtag) params.set('tag', selectedHashtag)
    if (sortBy !== 'recent') params.set('sort', sortBy)
    setSearchParams(params)
  }, [searchQuery, selectedCategory, selectedHashtag, sortBy])

  useEffect(() => {
    setCursor(null)
    setPosts([])
    setHasMore(true)
    fetchPosts(true)
  }, [searchQuery, selectedCategory, selectedHashtag, sortBy])

  const fetchPosts = async (reset = false) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (selectedCategory) params.set('category', selectedCategory)
      if (selectedHashtag) params.set('hashtag', selectedHashtag)
      params.set('sort_by', sortBy)
      if (cursor && !reset) params.set('cursor', cursor)
      params.set('limit', '10')

      const response = await api.get<PostFeedResponse>(`/posts/search?${params}`)
      const newPosts = response.data.posts

      if (reset) {
        setPosts(newPosts)
      } else {
        setPosts(prev => [...prev, ...newPosts])
      }
      setHasMore(response.data.has_more)
      setCursor(response.data.next_cursor)
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleHashtagClick = (tag: string) => {
    setSelectedHashtag(tag === selectedHashtag ? '' : tag)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedHashtag('')
    setSortBy('recent')
  }

  const hasActiveFilters = searchQuery || selectedCategory || selectedHashtag || sortBy !== 'recent'

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Explore</h1>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 space-y-4 border-t pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat.value}
                    variant={selectedCategory === cat.value ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.value)}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Sort by</label>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={sortBy === option.value ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Hash className="h-5 w-5 text-blue-500" />
          <h2 className="font-semibold">Trending Hashtags</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {TRENDING_HASHTAGS.map((item) => (
            <Button
              key={item.tag}
              variant={selectedHashtag === item.tag ? 'secondary' : 'outline'}
              size="sm"
              className="rounded-full"
              onClick={() => handleHashtagClick(item.tag)}
            >
              #{item.tag}
              <span className="ml-1 text-xs text-gray-400">({item.count})</span>
            </Button>
          ))}
        </div>
      </Card>

      {hasActiveFilters && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded-full text-xs">
                  Search: {searchQuery}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900 rounded-full text-xs">
                  Category: {CATEGORIES.find(c => c.value === selectedCategory)?.label}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory('')} />
                </span>
              )}
              {selectedHashtag && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 rounded-full text-xs">
                  #{selectedHashtag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedHashtag('')} />
                </span>
              )}
              {sortBy !== 'recent' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900 rounded-full text-xs">
                  Sort: {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSortBy('recent')} />
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {isLoading && posts.length === 0 ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="p-8 text-center">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {hasActiveFilters ? 'No posts match your search criteria' : 'No posts to explore yet'}
          </p>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                onClick={() => fetchPosts()}
                disabled={isLoading}
              >
                {isLoading ? (
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
