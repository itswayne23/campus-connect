import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { User, Post, Comment, Message, Notification } from '@/types'

export interface ActivityItem {
  id: string
  user_id: string
  action_type: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface ActivityLogResponse {
  activities: ActivityItem[]
  total: number
  has_more: boolean
}

export interface ActivityStats {
  stats: Record<string, number>
  period_days: number
}

export function useActivityLog(actionType?: string, limit: number = 50) {
  return useQuery({
    queryKey: ['activityLog', actionType, limit],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (actionType) params.append('action_type', actionType)
      params.append('limit', limit.toString())
      const response = await api.get<ActivityLogResponse>(`/activity?${params}`)
      return response.data
    },
  })
}

export function useActivityStats(days: number = 30) {
  return useQuery({
    queryKey: ['activityStats', days],
    queryFn: async () => {
      const response = await api.get<ActivityStats>(`/activity/stats?days=${days}`)
      return response.data
    },
  })
}

export function useLogActivity() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      action_type: string
      entity_type?: string
      entity_id?: string
      metadata?: Record<string, unknown>
    }) => {
      const response = await api.post('/activity', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activityLog'] })
      queryClient.invalidateQueries({ queryKey: ['activityStats'] })
    },
  })
}

export function useClearActivity() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (daysOld: number = 90) => {
      const response = await api.delete(`/activity/clear?days_old=${daysOld}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activityLog'] })
      queryClient.invalidateQueries({ queryKey: ['activityStats'] })
    },
  })
}

export interface ExportStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  file_url: string | null
  requested_at: string
  completed_at: string | null
  expires_at: string | null
}

export interface ExportData {
  user: Partial<User>
  posts: Partial<Post>[]
  comments: Partial<Comment>[]
  likes: { post_id: string; created_at: string }[]
  follows: { following_id: string; created_at: string }[]
  messages: Partial<Message>[]
  notifications: Partial<Notification>[]
  exported_at: string
}

export function useRequestExport() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<ExportStatus>('/export/request', { export_type: 'all' })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exportStatus'] })
    },
  })
}

export function useExportStatus() {
  return useQuery({
    queryKey: ['exportStatus'],
    queryFn: async () => {
      const response = await api.get<ExportStatus>('/export/status')
      return response.data
    },
    refetchInterval: (data) => {
      if (data?.status === 'pending' || data?.status === 'processing') {
        return 5000
      }
      return false
    },
  })
}

export function useExportData() {
  return useQuery({
    queryKey: ['exportData'],
    queryFn: async () => {
      const response = await api.get<ExportData>('/export/data')
      return response.data
    },
  })
}

export function useDownloadExport() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.get<{ download_url: string }>('/export/download')
      return response.data
    },
  })
}
