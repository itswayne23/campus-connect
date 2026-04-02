import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Message, Conversation } from '@/types'

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await api.get<Conversation[]>('/messages')
      return response.data
    },
  })
}

export function useMessages(userId: string) {
  return useQuery({
    queryKey: ['messages', userId],
    queryFn: async () => {
      const response = await api.get<Message[]>(`/messages/${userId}`)
      return response.data
    },
    enabled: !!userId,
    refetchInterval: 10000,
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { receiver_id: string; content: string; media_url?: string }) => {
      const response = await api.post<Message>('/messages', data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.receiver_id] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: () => {
      toast.error('Failed to send message')
    },
  })
}
