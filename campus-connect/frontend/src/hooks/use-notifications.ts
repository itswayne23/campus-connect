import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get<{ notifications: any[]; unread_count: number; has_more: boolean }>('/notifications')
      return response.data
    },
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await api.put(`/notifications/${notificationId}/read`)
      return notificationId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export interface NotificationSettings {
  push_likes: boolean
  push_comments: boolean
  push_follows: boolean
  push_messages: boolean
  push_mentions: boolean
  email_likes: boolean
  email_comments: boolean
  email_follows: boolean
  email_messages: boolean
  email_mentions: boolean
  push_subscribed: boolean
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notification-settings'],
    queryFn: async () => {
      const response = await api.get<NotificationSettings>('/notifications/settings')
      return response.data
    },
  })
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (settings: Partial<NotificationSettings>) => {
      const response = await api.put<NotificationSettings>('/notifications/settings', settings)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] })
    },
  })
}

export function useSubscribePush() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (subscription: PushSubscriptionJSON) => {
      await api.post('/notifications/push/subscribe', {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] })
    },
  })
}

export function useUnsubscribePush() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      await api.delete('/notifications/push/unsubscribe')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] })
    },
  })
}
