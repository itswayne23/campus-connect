import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Story, UserStories } from '@/types'

export function useStoriesFeed() {
  return useQuery({
    queryKey: ['storiesFeed'],
    queryFn: async () => {
      const response = await api.get<UserStories[]>('/stories/feed')
      return response.data
    },
  })
}

export function useMyStories() {
  return useQuery({
    queryKey: ['myStories'],
    queryFn: async () => {
      const response = await api.get<Story[]>('/stories/my')
      return response.data
    },
  })
}

export function useCreateStory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { media_url: string; media_type: 'image' | 'video'; caption?: string }) => {
      const response = await api.post<Story>('/stories', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storiesFeed'] })
      queryClient.invalidateQueries({ queryKey: ['myStories'] })
      toast.success('Story posted!')
    },
    onError: () => {
      toast.error('Failed to create story')
    },
  })
}

export function useViewStory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (storyId: string) => {
      await api.post(`/stories/${storyId}/view`)
      return storyId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storiesFeed'] })
    },
  })
}

export function useDeleteStory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (storyId: string) => {
      await api.delete(`/stories/${storyId}`)
      return storyId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storiesFeed'] })
      queryClient.invalidateQueries({ queryKey: ['myStories'] })
      toast.success('Story deleted')
    },
    onError: () => {
      toast.error('Failed to delete story')
    },
  })
}
