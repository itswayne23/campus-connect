import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'
import type { User } from '@/types'

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await api.get<User>(`/users/${userId}`)
      return response.data
    },
    enabled: !!userId,
  })
}

export function useUserByUsername(username: string) {
  return useQuery({
    queryKey: ['user', 'username', username],
    queryFn: async () => {
      const response = await api.get<User>(`/users/username/${encodeURIComponent(username)}`)
      return response.data
    },
    enabled: !!username && username.length >= 2,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: async (data: { username?: string; bio?: string; university?: string; avatar_url?: string }) => {
      const userId = user?.id
      if (!userId) {
        throw new Error('User not authenticated')
      }
      const response = await api.put<User>(`/users/${userId}`, data)
      return response.data
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      const { setUser } = useAuthStore.getState()
      setUser(updatedUser)
      toast.success('Profile updated!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update profile')
    },
  })
}

export function useUploadAvatar() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      
      const token = useAuthStore.getState().accessToken
      if (!token) {
        throw new Error('Not authenticated')
      }
      
      const response = await api.post<{ url: string }>('/users/avatar/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      })
      
      return response.data.url
    },
    onSuccess: async (avatarUrl) => {
      const userId = user?.id
      if (userId) {
        const response = await api.put<User>(`/users/${userId}`, { avatar_url: avatarUrl })
        queryClient.invalidateQueries({ queryKey: ['user'] })
        queryClient.invalidateQueries({ queryKey: ['currentUser'] })
        const { setUser } = useAuthStore.getState()
        setUser(response.data)
        toast.success('Profile picture updated!')
      }
    },
    onError: () => {
      toast.error('Failed to upload profile picture')
    },
  })
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: async () => {
      const userId = user?.id
      if (!userId) {
        throw new Error('User not authenticated')
      }
      const response = await api.delete(`/users/${userId}/avatar`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      const { setUser } = useAuthStore.getState()
      const currentUser = useAuthStore.getState().user
      if (currentUser) {
        setUser({ ...currentUser, avatar_url: null })
      }
      toast.success('Profile picture removed')
    },
    onError: () => {
      toast.error('Failed to remove profile picture')
    },
  })
}

export function useFollowUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post(`/users/${userId}/follow`)
      return { userId, ...response.data }
    },
    onSuccess: (data: any) => {
      if (data.success) {
        queryClient.setQueriesData({ queryKey: ['user'] }, (old: any) => {
          if (!old) return old
          return {
            ...old,
            is_following: true,
            followers_count: old.followers_count + 1,
          }
        })
        queryClient.invalidateQueries({ queryKey: ['currentUser'] })
        toast.success('Following user!')
      }
    },
    onError: () => {
      toast.error('Failed to follow user')
    },
  })
}

export function useUnfollowUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete(`/users/${userId}/follow`)
      return { userId, ...response.data }
    },
    onSuccess: (data: any) => {
      if (data.success) {
        queryClient.setQueriesData({ queryKey: ['user'] }, (old: any) => {
          if (!old) return old
          return {
            ...old,
            is_following: false,
            followers_count: Math.max(0, old.followers_count - 1),
          }
        })
        queryClient.invalidateQueries({ queryKey: ['currentUser'] })
        toast.success('Unfollowed user')
      }
    },
    onError: () => {
      toast.error('Failed to unfollow user')
    },
  })
}

export function useFollowers(userId: string) {
  return useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
      const response = await api.get<User[]>(`/users/${userId}/followers`)
      return response.data
    },
    enabled: !!userId,
  })
}

export function useFollowing(userId: string) {
  return useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      const response = await api.get<User[]>(`/users/${userId}/following`)
      return response.data
    },
    enabled: !!userId,
  })
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['searchUsers', query],
    queryFn: async () => {
      const response = await api.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`)
      return response.data
    },
    enabled: query.length >= 2,
  })
}

export function useBlockUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post(`/users/${userId}/block`)
      return { userId, ...response.data }
    },
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast.success('User blocked')
    },
    onError: () => {
      toast.error('Failed to block user')
    },
  })
}

export function useUnblockUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete(`/users/${userId}/block`)
      return { userId, ...response.data }
    },
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      toast.success('User unblocked')
    },
    onError: () => {
      toast.error('Failed to unblock user')
    },
  })
}

export function useReportUser() {
  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const response = await api.post(`/users/${userId}/report?reason=${encodeURIComponent(reason)}`)
      return response.data
    },
    onSuccess: () => {
      toast.success('User reported. Thank you for your feedback.')
    },
    onError: () => {
      toast.error('Failed to report user')
    },
  })
}
