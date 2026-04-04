import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface ScheduledPost {
  id: string
  user_id: string
  content: string
  media_urls: string[]
  category: string | null
  poll_data: any | null
  is_anonymous: boolean
  scheduled_at: string
  status: string
  created_at: string
}

interface CreateScheduledPostData {
  content: string
  media_urls?: string[]
  category?: string
  poll_data?: any
  is_anonymous?: boolean
  scheduled_at: string
}

export function useScheduledPosts() {
  return useQuery({
    queryKey: ['scheduled-posts'],
    queryFn: async () => {
      const response = await api.get<ScheduledPost[]>('/scheduled')
      return response.data
    },
  })
}

export function useCreateScheduledPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateScheduledPostData) => {
      const response = await api.post<ScheduledPost>('/scheduled', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] })
      toast.success('Post scheduled successfully!')
    },
    onError: () => {
      toast.error('Failed to schedule post')
    },
  })
}

export function useUpdateScheduledPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ postId, ...data }: { postId: string } & Partial<CreateScheduledPostData>) => {
      const response = await api.put<ScheduledPost>(`/scheduled/${postId}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] })
      toast.success('Scheduled post updated!')
    },
    onError: () => {
      toast.error('Failed to update scheduled post')
    },
  })
}

export function useCancelScheduledPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      await api.post(`/scheduled/${postId}/cancel`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] })
      toast.success('Scheduled post cancelled')
    },
    onError: () => {
      toast.error('Failed to cancel scheduled post')
    },
  })
}

export function useDeleteScheduledPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      await api.delete(`/scheduled/${postId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] })
      toast.success('Scheduled post deleted')
    },
    onError: () => {
      toast.error('Failed to delete scheduled post')
    },
  })
}
