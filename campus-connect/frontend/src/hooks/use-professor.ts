import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface ProfessorRating {
  id: string
  user_id: string
  user_username: string
  professor_name: string
  course_code: string
  department: string | null
  overall_rating: number
  difficulty: number
  would_take_again: boolean
  attendance_mandatory: boolean
  grade_type: string | null
  comment: string | null
  upvotes: number
  created_at: string
}

export interface ProfessorStats {
  professor_name: string
  course_code: string
  department: string | null
  average_rating: number
  average_difficulty: number
  total_ratings: number
  would_take_again_percentage: number
  attendance_mandatory_percentage: number
}

export interface ProfessorStatsResponse {
  stats: ProfessorStats
  recent_ratings: ProfessorRating[]
}

export function useSearchProfessors(query: string) {
  return useQuery({
    queryKey: ['professors', 'search', query],
    queryFn: async () => {
      const response = await api.get<Array<{ professor_name: string; department: string | null }>>(`/professors/search?q=${encodeURIComponent(query)}`)
      return response.data
    },
    enabled: query.length >= 2,
  })
}

export function useProfessorRatings(professorName: string, courseCode?: string) {
  return useQuery({
    queryKey: ['professors', professorName, courseCode],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (courseCode) params.append('course_code', courseCode)
      const response = await api.get<ProfessorRating[]>(`/professors/${encodeURIComponent(professorName)}?${params}`)
      return response.data
    },
    enabled: !!professorName,
  })
}

export function useProfessorStats(professorName: string, courseCode?: string) {
  return useQuery({
    queryKey: ['professors', professorName, courseCode, 'stats'],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (courseCode) params.append('course_code', courseCode)
      const response = await api.get<ProfessorStatsResponse>(`/professors/${encodeURIComponent(professorName)}/stats?${params}`)
      return response.data
    },
    enabled: !!professorName,
  })
}

export function useCreateProfessorRating() {
  return useMutation({
    mutationFn: async (data: {
      professor_name: string
      course_code: string
      department?: string
      overall_rating: number
      difficulty: number
      would_take_again: boolean
      attendance_mandatory?: boolean
      grade_type?: string
      comment?: string
    }) => {
      const response = await api.post<ProfessorRating>('/professors', data)
      return response.data
    },
  })
}

export function useUpvoteProfessorRating() {
  return useMutation({
    mutationFn: async (ratingId: string) => {
      const response = await api.post(`/professors/${ratingId}/upvote`)
      return response.data
    },
  })
}
