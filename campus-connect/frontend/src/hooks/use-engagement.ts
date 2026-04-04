import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export interface ThreadPost {
  id: string
  author_id: string
  content: string
  media_urls: string[]
  is_anonymous: boolean
  is_thread_reply: boolean
  reply_count: number
  thread_id: string | null
  created_at: string
}

export interface Event {
  id: string
  user_id: string
  title: string
  description: string | null
  location: string | null
  event_type: string
  start_date: string
  end_date: string | null
  is_recurring: boolean
  recurring_pattern: string | null
  max_attendees: number | null
  cover_image_url: string | null
  is_public: boolean
  attendees_count: number
  user_rsvp: 'going' | 'maybe' | 'not_going' | null
  created_at: string
}

export interface Reputation {
  user_id: string
  karma_score: number
  total_posts_score: number
  total_comments_score: number
  total_likes_score: number
  quality_posts: number
  helpful_answers: number
  community_help: number
  rank: number | null
}

export interface Highlight {
  id: string
  user_id: string
  title: string
  cover_story_id: string | null
  is_active: boolean
  stories_count: number
  created_at: string
}

export function useThread(postId: string) {
  return useQuery({
    queryKey: ['thread', postId],
    queryFn: async () => {
      const response = await api.get<ThreadPost[]>(`/engagement/threads/${postId}`)
      return response.data
    },
    enabled: !!postId,
  })
}

export function useCreateThreadReply() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ postId, content, mediaUrls, poll, isAnonymous, category }: {
      postId: string
      content: string
      mediaUrls?: string[]
      poll?: any
      isAnonymous?: boolean
      category?: string
    }) => {
      const response = await api.post<ThreadPost>(`/engagement/threads/${postId}/reply`, {
        content,
        media_urls: mediaUrls,
        poll,
        is_anonymous: isAnonymous,
        category
      })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['thread', variables.postId] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.success('Reply added to thread')
    },
    onError: () => {
      toast.error('Failed to add reply')
    },
  })
}

export function useEvents(eventType?: string, upcoming: boolean = false) {
  return useQuery({
    queryKey: ['events', eventType, upcoming],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (eventType) params.append('event_type', eventType)
      if (upcoming) params.append('upcoming', 'true')
      const response = await api.get<Event[]>(`/engagement/events?${params}`)
      return response.data
    },
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      title: string
      description?: string
      location?: string
      event_type?: string
      start_date: string
      end_date?: string
      is_recurring?: boolean
      max_attendees?: number
    }) => {
      const response = await api.post<Event>('/engagement/events', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('Event created')
    },
    onError: () => {
      toast.error('Failed to create event')
    },
  })
}

export function useUpdateRSVP() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: 'going' | 'maybe' | 'not_going' }) => {
      await api.put(`/engagement/events/${eventId}/rsvp`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('RSVP updated')
    },
    onError: () => {
      toast.error('Failed to update RSVP')
    },
  })
}

export function useReputation(userId: string) {
  return useQuery({
    queryKey: ['reputation', userId],
    queryFn: async () => {
      const response = await api.get<Reputation>(`/engagement/reputation/${userId}`)
      return response.data
    },
    enabled: !!userId,
  })
}

export function useHighlights() {
  return useQuery({
    queryKey: ['highlights'],
    queryFn: async () => {
      const response = await api.get<Highlight[]>('/engagement/highlights')
      return response.data
    },
  })
}

export function useCreateHighlight() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (title: string) => {
      const response = await api.post<Highlight>('/engagement/highlights', { title })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highlights'] })
      toast.success('Highlight created')
    },
    onError: () => {
      toast.error('Failed to create highlight')
    },
  })
}

export function useAddStoryToHighlight() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ highlightId, storyId }: { highlightId: string; storyId: string }) => {
      await api.post(`/engagement/highlights/${highlightId}/stories/${storyId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highlights'] })
      toast.success('Story added to highlight')
    },
  })
}

export function useDeleteHighlight() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (highlightId: string) => {
      await api.delete(`/engagement/highlights/${highlightId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highlights'] })
      toast.success('Highlight deleted')
    },
  })
}
