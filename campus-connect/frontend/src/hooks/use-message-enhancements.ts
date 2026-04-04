import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export interface MessageReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
}

export interface TypingStatus {
  user_id: string
  username: string
  is_typing: boolean
}

export function useAddReaction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const response = await api.post<MessageReaction>('/messages/reactions', {
        message_id: messageId,
        emoji
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })
}

export function useMessageReactions(messageId: string) {
  return useQuery({
    queryKey: ['messageReactions', messageId],
    queryFn: async () => {
      const response = await api.get<MessageReaction[]>(`/messages/${messageId}/reactions`)
      return response.data
    },
    enabled: !!messageId,
  })
}

export function useUpdateTypingStatus() {
  return useMutation({
    mutationFn: async ({ conversationWith, isTyping }: { conversationWith: string; isTyping: boolean }) => {
      await api.post('/messages/typing', {
        conversation_with: conversationWith,
        is_typing: isTyping
      })
    },
  })
}

export function useTypingStatus(userId: string) {
  return useQuery({
    queryKey: ['typingStatus', userId],
    queryFn: async () => {
      const response = await api.get<TypingStatus[]>(`/messages/${userId}/typing`)
      return response.data
    },
    enabled: !!userId,
    refetchInterval: 3000,
  })
}

export function useMarkMessagesRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (senderId: string) => {
      await api.post('/messages/mark-read', null, { params: { sender_id: senderId } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useReadStatus(userId: string) {
  return useQuery({
    queryKey: ['readStatus', userId],
    queryFn: async () => {
      const response = await api.get<{ is_read: boolean | null; read_at: string | null }>(`/messages/conversations/${userId}/status`)
      return response.data
    },
    enabled: !!userId,
  })
}
