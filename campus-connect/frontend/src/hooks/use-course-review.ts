import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface CourseReview {
  id: string
  user_id: string
  user_username: string
  course_code: string
  course_name: string
  department: string | null
  semester: string | null
  overall_rating: number
  difficulty: number
  workload: number
  lecture_quality: number
  materials_quality: number
  comment: string | null
  pros: string[]
  cons: string[]
  upvotes: number
  created_at: string
}

export interface CourseStats {
  course_code: string
  course_name: string
  department: string | null
  average_overall: number
  average_difficulty: number
  average_workload: number
  average_lecture_quality: number
  average_materials_quality: number
  total_reviews: number
}

export interface CourseStatsResponse {
  stats: CourseStats
  recent_reviews: CourseReview[]
}

export function useSearchCourses(query: string) {
  return useQuery({
    queryKey: ['courses', 'search', query],
    queryFn: async () => {
      const response = await api.get<Array<{ course_code: string; course_name: string; department: string | null }>>(`/courses/search?q=${encodeURIComponent(query)}`)
      return response.data
    },
    enabled: query.length >= 2,
  })
}

export function useCourseReviews(courseCode: string, semester?: string) {
  return useQuery({
    queryKey: ['courses', courseCode, semester],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (semester) params.append('semester', semester)
      const response = await api.get<CourseReview[]>(`/courses/${encodeURIComponent(courseCode)}?${params}`)
      return response.data
    },
    enabled: !!courseCode,
  })
}

export function useCourseStats(courseCode: string) {
  return useQuery({
    queryKey: ['courses', courseCode, 'stats'],
    queryFn: async () => {
      const response = await api.get<CourseStatsResponse>(`/courses/${encodeURIComponent(courseCode)}/stats`)
      return response.data
    },
    enabled: !!courseCode,
  })
}

export function useCreateCourseReview() {
  return useMutation({
    mutationFn: async (data: {
      course_code: string
      course_name: string
      department?: string
      semester?: string
      overall_rating: number
      difficulty: number
      workload: number
      lecture_quality: number
      materials_quality: number
      comment?: string
      pros?: string[]
      cons?: string[]
    }) => {
      const response = await api.post<CourseReview>('/courses', data)
      return response.data
    },
  })
}

export function useUpvoteCourseReview() {
  return useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await api.post(`/courses/${reviewId}/upvote`)
      return response.data
    },
  })
}
