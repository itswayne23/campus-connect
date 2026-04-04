import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Post, PostFeedResponse, Comment, PostCategory, Poll, PollOption } from '@/types'

interface PollData {
  question: string
  options: { text: string; votes: number }[]
  is_multiple_choice: boolean
}

export function useFeed(cursor?: string) {
  return useInfiniteQuery({
    queryKey: ['feed', cursor],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      if (pageParam) params.append('cursor', pageParam)
      params.append('limit', '20')
      
      const response = await api.get<PostFeedResponse>(`/posts/feed?${params}`)
      return response.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  })
}

export function useExploreFeed() {
  return useInfiniteQuery({
    queryKey: ['explore'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      if (pageParam) params.append('cursor', pageParam)
      params.append('limit', '20')
      
      const response = await api.get<PostFeedResponse>(`/posts/explore?${params}`)
      return response.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  })
}

interface SearchParams {
  q?: string
  category?: string
  hashtag?: string
  sortBy?: 'recent' | 'popular' | 'trending'
}

export function useSearchPosts(params: SearchParams) {
  return useInfiniteQuery({
    queryKey: ['search', params],
    queryFn: async ({ pageParam }) => {
      const searchParams = new URLSearchParams()
      if (params.q) searchParams.set('q', params.q)
      if (params.category) searchParams.set('category', params.category)
      if (params.hashtag) searchParams.set('hashtag', params.hashtag)
      if (params.sortBy) searchParams.set('sort_by', params.sortBy)
      if (pageParam) searchParams.set('cursor', pageParam)
      searchParams.set('limit', '10')
      
      const response = await api.get<PostFeedResponse>(`/posts/search?${searchParams}`)
      return response.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: !!(params.q || params.category || params.hashtag),
  })
}

export function useForYouFeed() {
  return useInfiniteQuery({
    queryKey: ['forYou'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      if (pageParam) params.append('cursor', pageParam)
      params.append('limit', '20')
      
      const response = await api.get<PostFeedResponse>(`/posts/for-you?${params}`)
      return response.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  })
}

export function useAnonymousFeed(category?: PostCategory) {
  return useInfiniteQuery({
    queryKey: ['anonymous', category],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      if (pageParam) params.append('cursor', pageParam)
      if (category) params.append('category', category)
      params.append('limit', '20')
      
      const response = await api.get<PostFeedResponse>(`/anonymous/feed?${params}`)
      return response.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  })
}

export function usePost(postId: string) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const response = await api.get<Post>(`/posts/${postId}`)
      return response.data
    },
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { content: string; media_urls?: string[]; is_anonymous?: boolean; category?: string; poll?: PollData }) => {
      const response = await api.post<Post>('/posts', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['explore'] })
      toast.success('Post created!')
    },
    onError: () => {
      toast.error('Failed to create post')
    },
  })
}

export function useCreateAnonymousPost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { content: string; media_urls?: string[]; category?: string }) => {
      const response = await api.post<Post>('/anonymous/posts', { ...data, is_anonymous: true })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anonymous'] })
      toast.success('Anonymous post submitted for review!')
    },
    onError: () => {
      toast.error('Failed to create anonymous post')
    },
  })
}

export function useUpdatePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { postId: string; content: string; media_urls?: string[] }) => {
      const response = await api.put<Post>(`/posts/${data.postId}`, { content: data.content, media_urls: data.media_urls })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['explore'] })
      toast.success('Post updated!')
    },
    onError: () => {
      toast.error('Failed to update post')
    },
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (postId: string) => {
      await api.delete(`/posts/${postId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['explore'] })
      queryClient.invalidateQueries({ queryKey: ['post'] })
      toast.success('Post deleted')
    },
    onError: () => {
      toast.error('Failed to delete post')
    },
  })
}

export function useLikePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.post<{ likes_count: number; is_liked: boolean }>(`/posts/${postId}/like`)
      return { postId, ...response.data }
    },
    onSuccess: ({ postId, likes_count, is_liked }) => {
      queryClient.setQueriesData({ queryKey: ['feed'] }, (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: Post) =>
              post.id === postId ? { ...post, likes_count, is_liked } : post
            ),
          })),
        }
      })
      queryClient.invalidateQueries({ queryKey: ['post'] })
    },
  })
}

export function useComments(postId: string) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const response = await api.get<Comment[]>(`/posts/${postId}/comments`)
      return response.data
    },
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { post_id: string; content: string; is_anonymous?: boolean; parent_id?: string }) => {
      const response = await api.post<Comment>(`/posts/${data.post_id}/comments`, {
        content: data.content,
        is_anonymous: data.is_anonymous,
        parent_id: data.parent_id,
      })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.post_id] })
      queryClient.invalidateQueries({ queryKey: ['post', variables.post_id] })
    },
    onError: () => {
      toast.error('Failed to add comment')
    },
  })
}

export function useBookmarkPost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.post<{ is_bookmarked: boolean }>(`/posts/${postId}/bookmark`)
      return { postId, ...response.data }
    },
    onSuccess: ({ postId, is_bookmarked }) => {
      queryClient.setQueriesData({ queryKey: ['feed'] }, (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: Post) =>
              post.id === postId ? { ...post, is_bookmarked: is_bookmarked } : post
            ),
          })),
        }
      })
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}

export function useRemoveBookmark() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.delete<{ is_bookmarked: boolean }>(`/posts/${postId}/bookmark`)
      return { postId, ...response.data }
    },
    onSuccess: ({ postId }) => {
      queryClient.setQueriesData({ queryKey: ['feed'] }, (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: Post) =>
              post.id === postId ? { ...post, is_bookmarked: false } : post
            ),
          })),
        }
      })
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}

export function useBookmarks() {
  return useInfiniteQuery({
    queryKey: ['bookmarks'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      if (pageParam) params.append('cursor', pageParam)
      params.append('limit', '20')
      
      const response = await api.get<PostFeedResponse>(`/posts/bookmarks?${params}`)
      return response.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  })
}

export function useRequestDeletePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { postId: string; reason?: string }) => {
      const response = await api.post<{ message: string; request_id: string }>(`/posts/${data.postId}/request-delete`, {
        reason: data.reason || '',
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast.success('Delete request submitted. You will be notified when an admin reviews it.')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit delete request')
    },
  })
}

export function useRepostPost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.post<{ success: boolean }>(`/posts/${postId}/repost`)
      return { postId, ...response.data }
    },
    onSuccess: ({ postId }) => {
      queryClient.setQueriesData({ queryKey: ['feed'] }, (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: Post) =>
              post.id === postId ? { ...post, is_reposted: true, repost_count: post.repost_count + 1 } : post
            ),
          })),
        }
      })
      toast.success('Reposted!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to repost')
    },
  })
}

export function useRemoveRepost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.delete<{ success: boolean }>(`/posts/${postId}/repost`)
      return { postId, ...response.data }
    },
    onSuccess: ({ postId }) => {
      queryClient.setQueriesData({ queryKey: ['feed'] }, (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: Post) =>
              post.id === postId ? { ...post, is_reposted: false, repost_count: Math.max(0, post.repost_count - 1) } : post
            ),
          })),
        }
      })
      toast.success('Removed repost')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to remove repost')
    },
  })
}
