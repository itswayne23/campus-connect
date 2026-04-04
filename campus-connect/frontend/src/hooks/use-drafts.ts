import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface Draft {
  id: string
  user_id: string
  content: string
  media_urls: string[]
  category: string | null
  poll_data: any
  is_anonymous: boolean
  created_at: string
  updated_at: string
}

export function useDraft() {
  return useQuery({
    queryKey: ['draft'],
    queryFn: async () => {
      const response = await api.get<Draft | null>('/drafts')
      return response.data
    },
  })
}

export function useSaveDraft() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      content?: string
      media_urls?: string[]
      category?: string
      poll_data?: any
      is_anonymous?: boolean
    }) => {
      const response = await api.post<Draft>('/drafts', {
        content: data.content || '',
        media_urls: data.media_urls || [],
        category: data.category,
        poll_data: data.poll_data,
        is_anonymous: data.is_anonymous || false
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft'] })
    },
  })
}

export function useDeleteDraft() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (draftId: string) => {
      await api.delete(`/drafts/${draftId}`)
      return draftId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft'] })
      toast.success('Draft deleted')
    },
    onError: () => {
      toast.error('Failed to delete draft')
    },
  })
}

export function useClearDraft() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      await api.delete('/drafts')
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft'] })
      toast.success('Draft cleared')
    },
    onError: () => {
      toast.error('Failed to clear draft')
    },
  })
}
