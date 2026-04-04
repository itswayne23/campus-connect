import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface ChatMessage {
  id: string
  session_id: string
  user_id: string
  message: string
  role: 'user' | 'assistant'
  created_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  title: string
  preview: string
  created_at: string
  updated_at: string
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[]
}

export interface ChatResponse {
  session_id: string
  user_message: ChatMessage
  assistant_message: ChatMessage
}

export function useChatSessions() {
  return useQuery({
    queryKey: ['ai', 'sessions'],
    queryFn: async () => {
      const response = await api.get<ChatSession[]>('/ai/sessions')
      return response.data
    },
  })
}

export function useChatSession(sessionId: string) {
  return useQuery({
    queryKey: ['ai', 'session', sessionId],
    queryFn: async () => {
      const response = await api.get<ChatSessionWithMessages>(`/ai/sessions/${sessionId}`)
      return response.data
    },
    enabled: !!sessionId,
  })
}

export function useSendChatMessage() {
  return useMutation({
    mutationFn: async (data: { message: string; session_id?: string }) => {
      const response = await api.post<ChatResponse>('/ai/chat', data)
      return response.data
    },
  })
}

export function useCreateChatSession() {
  return useMutation({
    mutationFn: async (title: string = 'New Chat') => {
      const response = await api.post<ChatSession>('/ai/sessions', null, { params: { title } })
      return response.data
    },
  })
}

export function useDeleteChatSession() {
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await api.delete(`/ai/sessions/${sessionId}`)
      return response.data
    },
  })
}
