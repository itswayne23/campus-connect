import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export interface Collection {
  id: string
  user_id: string
  name: string
  description: string | null
  is_public: boolean
  posts_count: number
  created_at: string
  updated_at: string
}

export interface CollectionDetail extends Collection {
  posts: unknown[]
}

export interface ThemePreferences {
  theme: 'light' | 'dark' | 'system'
  accent_color: string
  custom_dark_bg: string | null
  custom_light_bg: string | null
  font_size: 'small' | 'medium' | 'large'
  reduced_motion: boolean
  high_contrast: boolean
}

export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await api.get<Collection[]>('/features/collections')
      return response.data
    },
  })
}

export function useCollection(collectionId: string) {
  return useQuery({
    queryKey: ['collection', collectionId],
    queryFn: async () => {
      const response = await api.get<CollectionDetail>(`/features/collections/${collectionId}`)
      return response.data
    },
    enabled: !!collectionId,
  })
}

export function useCreateCollection() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; is_public?: boolean }) => {
      const response = await api.post<Collection>('/features/collections', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      toast.success('Collection created')
    },
    onError: () => {
      toast.error('Failed to create collection')
    },
  })
}

export function useUpdateCollection() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; is_public?: boolean }) => {
      const response = await api.put<Collection>(`/features/collections/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      toast.success('Collection updated')
    },
    onError: () => {
      toast.error('Failed to update collection')
    },
  })
}

export function useDeleteCollection() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (collectionId: string) => {
      await api.delete(`/features/collections/${collectionId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      toast.success('Collection deleted')
    },
    onError: () => {
      toast.error('Failed to delete collection')
    },
  })
}

export function useAddToCollection() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ collectionId, postId }: { collectionId: string; postId: string }) => {
      await api.post(`/features/collections/${collectionId}/posts`, { post_id: postId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['collection'] })
      toast.success('Added to collection')
    },
    onError: () => {
      toast.error('Failed to add to collection')
    },
  })
}

export function useRemoveFromCollection() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ collectionId, postId }: { collectionId: string; postId: string }) => {
      await api.delete(`/features/collections/${collectionId}/posts/${postId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['collection'] })
    },
  })
}

export function useTheme() {
  return useQuery({
    queryKey: ['theme'],
    queryFn: async () => {
      const response = await api.get<ThemePreferences>('/features/theme')
      return response.data
    },
  })
}

export function useUpdateTheme() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: Partial<ThemePreferences>) => {
      const response = await api.put<ThemePreferences>('/features/theme', data)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['theme'], data)
      toast.success('Theme updated')
    },
    onError: () => {
      toast.error('Failed to update theme')
    },
  })
}
