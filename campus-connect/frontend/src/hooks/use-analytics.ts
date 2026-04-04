import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AnalyticsDashboard, PostInsight } from '@/types'

export function useAnalyticsDashboard(days: number = 30) {
  return useQuery({
    queryKey: ['analytics', 'dashboard', days],
    queryFn: async () => {
      const response = await api.get<AnalyticsDashboard>(`/analytics/dashboard?days=${days}`)
      return response.data
    },
  })
}

export function usePostInsights(postId: string) {
  return useQuery({
    queryKey: ['analytics', 'post', postId],
    queryFn: async () => {
      const response = await api.get<PostInsight>(`/analytics/posts/${postId}`)
      return response.data
    },
    enabled: !!postId,
  })
}

export function useTrackPostView() {
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.post('/analytics/track-view', { post_id: postId })
      return response.data
    },
  })
}

import { useMutation } from '@tanstack/react-query'
