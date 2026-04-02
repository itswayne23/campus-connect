import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { AuthResponse, User } from '@/types'

export function useLogin() {
  const navigate = useNavigate()
  
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await api.post<AuthResponse>('/auth/login', data)
      return response.data
    },
    onSuccess: (data) => {
      useAuthStore.getState().setAuth(data.user, data.access_token, data.refresh_token)
      toast.success('Welcome back!')
      navigate('/')
    },
    onError: () => {
      toast.error('Invalid email or password')
    },
  })
}

export function useRegister() {
  const navigate = useNavigate()
  
  return useMutation({
    mutationFn: async (data: { email: string; password: string; username: string }) => {
      const response = await api.post<AuthResponse>('/auth/register', data)
      return response.data
    },
    onSuccess: (data) => {
      useAuthStore.getState().setAuth(data.user, data.access_token, data.refresh_token)
      toast.success('Account created successfully!')
      navigate('/')
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Registration failed'
      toast.error(message)
    },
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout')
    },
    onSuccess: () => {
      useAuthStore.getState().logout()
      queryClient.clear()
      toast.success('Logged out successfully')
      navigate('/login')
    },
    onError: () => {
      useAuthStore.getState().logout()
      queryClient.clear()
      navigate('/login')
    },
  })
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await api.get<User>('/auth/me')
      return response.data
    },
    enabled: useAuthStore.getState().isAuthenticated,
    staleTime: 1000 * 60 * 5,
  })
}
