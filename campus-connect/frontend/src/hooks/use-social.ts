import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export interface HashtagFollow {
  id: string
  user_id: string
  hashtag: string
  created_at: string
}

export interface BookmarkWithNote {
  id: string
  post_id: string
  user_id: string
  note: string | null
  folder: string | null
  created_at: string
}

export interface Mention {
  id: string
  user_id: string
  mentioned_by: string
  mentioned_by_username: string | null
  post_id: string | null
  comment_id: string | null
  is_read: boolean
  created_at: string
}

export interface QuickReaction {
  id: string
  user_id: string
  post_id: string
  reaction_type: string
  created_at: string
}

export function useFollowedHashtags() {
  return useQuery({
    queryKey: ['followedHashtags'],
    queryFn: async () => {
      const response = await api.get<HashtagFollow[]>('/social/hashtags/following')
      return response.data
    },
  })
}

export function useFollowHashtag() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (hashtag: string) => {
      const response = await api.post<{ success: boolean; following: boolean; hashtag: string }>(`/social/hashtags/follow/${hashtag}`)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['followedHashtags'] })
      toast.success(data.following ? `Following #${data.hashtag}` : `Unfollowed #${data.hashtag}`)
    },
  })
}

export function useHashtagPosts(hashtag: string, limit: number = 20) {
  return useQuery({
    queryKey: ['hashtagPosts', hashtag],
    queryFn: async () => {
      const response = await api.get(`/social/hashtags/${hashtag}/posts?limit=${limit}`)
      return response.data
    },
    enabled: !!hashtag,
  })
}

export function useBookmarks(folder?: string) {
  return useQuery({
    queryKey: ['bookmarks', folder],
    queryFn: async () => {
      const params = folder ? `?folder=${encodeURIComponent(folder)}` : ''
      const response = await api.get<BookmarkWithNote[]>(`/social/bookmarks${params}`)
      return response.data
    },
  })
}

export function useBookmarkFolders() {
  return useQuery({
    queryKey: ['bookmarkFolders'],
    queryFn: async () => {
      const response = await api.get<{ folders: string[] }>('/social/bookmarks/folders')
      return response.data
    },
  })
}

export function useUpdateBookmarkNote() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ postId, note, folder }: { postId: string; note?: string; folder?: string }) => {
      await api.put(`/social/bookmarks/${postId}/note`, { note, folder })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      toast.success('Bookmark updated')
    },
  })
}

export function useMentions(unreadOnly: boolean = false) {
  return useQuery({
    queryKey: ['mentions', unreadOnly],
    queryFn: async () => {
      const response = await api.get<Mention[]>(`/social/mentions?unread_only=${unreadOnly}`)
      return response.data
    },
  })
}

export function useMarkMentionRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (mentionId: string) => {
      await api.put(`/social/mentions/${mentionId}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentions'] })
    },
  })
}

export function useMarkAllMentionsRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      await api.put('/social/mentions/read-all')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentions'] })
    },
  })
}

export function useQuickReaction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ postId, reactionType = 'like' }: { postId: string; reactionType?: string }) => {
      const response = await api.post<{ success: boolean; already_reacted: boolean }>(`/social/quick-reaction/${postId}?reaction_type=${reactionType}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}

export function useCheckQuickReactions(postIds: string[]) {
  return useQuery({
    queryKey: ['quickReactions', postIds],
    queryFn: async () => {
      const response = await api.get<{ reacted_posts: string[] }>(`/social/quick-reactions/check?post_ids=${postIds.join(',')}`)
      return response.data
    },
    enabled: postIds.length > 0,
  })
}
