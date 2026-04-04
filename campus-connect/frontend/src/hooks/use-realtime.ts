import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient, RealtimeChannel } from '@supabase/supabase-js'
import { useAuthStore } from '@/store/auth-store'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
)

export function useRealtimeNotifications() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const handleNotification = useCallback((payload: any) => {
    if (payload.eventType === 'INSERT') {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  }, [queryClient])

  useEffect(() => {
    if (!user?.id) return

    channelRef.current = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        handleNotification
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [user?.id, handleNotification])
}

export function useRealtimeMessages() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const handleMessage = useCallback((payload: any) => {
    if (payload.eventType === 'INSERT') {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['messages', payload.new.conversation_id || payload.new.id] })
    }
  }, [queryClient])

  useEffect(() => {
    if (!user?.id) return

    channelRef.current = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        handleMessage
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [user?.id, handleMessage])
}

export function useRealtimePosts() {
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const handlePost = useCallback((payload: any) => {
    if (payload.eventType === 'INSERT') {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['for-you'] })
    } else if (payload.eventType === 'UPDATE') {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    } else if (payload.eventType === 'DELETE') {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    }
  }, [queryClient])

  useEffect(() => {
    channelRef.current = supabase
      .channel('posts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
        },
        handlePost
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [handlePost])
}

export function useRealtime() {
  useRealtimeNotifications()
  useRealtimeMessages()
  useRealtimePosts()
}
