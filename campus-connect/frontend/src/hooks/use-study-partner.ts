import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface StudyPartnerRequest {
  id: string
  user_id: string
  user_username: string
  user_avatar_url: string | null
  course: string
  topic: string | null
  description: string | null
  preferred_method: string
  availability: string | null
  is_active: boolean
  created_at: string
}

export interface StudyMatch {
  id: string
  request_id: string
  matched_user_id: string
  matched_username: string
  matched_avatar_url: string | null
  matched_course: string
  matched_topic: string | null
  created_at: string
}

export function useStudyPartnerRequests(filters?: { course?: string; topic?: string; preferred_method?: string }) {
  return useQuery({
    queryKey: ['study', 'requests', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.course) params.append('course', filters.course)
      if (filters?.topic) params.append('topic', filters.topic)
      if (filters?.preferred_method) params.append('preferred_method', filters.preferred_method)
      const response = await api.get<StudyPartnerRequest[]>(`/study?${params}`)
      return response.data
    },
  })
}

export function useMyStudyRequests() {
  return useQuery({
    queryKey: ['study', 'my-requests'],
    queryFn: async () => {
      const response = await api.get<StudyPartnerRequest[]>('/study/my-requests')
      return response.data
    },
  })
}

export function useMyStudyMatches() {
  return useQuery({
    queryKey: ['study', 'matches'],
    queryFn: async () => {
      const response = await api.get<StudyMatch[]>('/study/matches')
      return response.data
    },
  })
}

export function useCreateStudyRequest() {
  return useMutation({
    mutationFn: async (data: {
      course: string
      topic?: string
      description?: string
      preferred_method?: string
      availability?: string
    }) => {
      const response = await api.post<StudyPartnerRequest>('/study', data)
      return response.data
    },
  })
}

export function useDeleteStudyRequest() {
  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await api.delete(`/study/${requestId}`)
      return response.data
    },
  })
}

export function useCreateStudyMatch() {
  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await api.post<StudyMatch>(`/study/match/${requestId}`)
      return response.data
    },
  })
}
