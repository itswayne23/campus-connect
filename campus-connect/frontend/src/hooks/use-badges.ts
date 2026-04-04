import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { UserBadges, Badge } from '@/types'

export function useUserBadges(userId: string) {
  return useQuery({
    queryKey: ['userBadges', userId],
    queryFn: async () => {
      const response = await api.get<UserBadges>(`/verification/badges?user_id=${userId}`)
      return response.data
    },
    enabled: !!userId,
  })
}

export function useMyBadges() {
  return useQuery({
    queryKey: ['myBadges'],
    queryFn: async () => {
      const response = await api.get<UserBadges>('/verification/my-badges')
      return response.data
    },
  })
}

export function useCheckBadges() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ new_badges_earned: string[]; total_badges: number }>('/verification/check-badges')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBadges'] })
      queryClient.invalidateQueries({ queryKey: ['userBadges'] })
    },
  })
}

export function useVerifyUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ userId, verify }: { userId: string; verify: boolean }) => {
      const response = await api.post('/verification/verify', { user_id: userId, verify })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}
