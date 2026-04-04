import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface MoodEntry {
  id: string
  user_id: string
  mood: string
  note: string | null
  activities: string[]
  created_at: string
}

export interface MoodStats {
  total_entries: number
  mood_distribution: Record<string, number>
  average_mood: string | null
  streak_days: number
  weekly_data: Array<{ date: string; mood: string | null; count: number }>
}

export interface MoodStatsResponse {
  stats: MoodStats
  recent_entries: MoodEntry[]
}

export function useMoodEntries(limit: number = 30) {
  return useQuery({
    queryKey: ['mood', 'entries', limit],
    queryFn: async () => {
      const response = await api.get<MoodEntry[]>(`/mood?limit=${limit}`)
      return response.data
    },
  })
}

export function useMoodStats() {
  return useQuery({
    queryKey: ['mood', 'stats'],
    queryFn: async () => {
      const response = await api.get<MoodStatsResponse>('/mood/stats')
      return response.data
    },
  })
}

export function useCreateMoodEntry() {
  return useMutation({
    mutationFn: async (data: { mood: string; note?: string; activities?: string[] }) => {
      const response = await api.post<MoodEntry>('/mood', data)
      return response.data
    },
  })
}

export function useDeleteMoodEntry() {
  return useMutation({
    mutationFn: async (entryId: string) => {
      const response = await api.delete(`/mood/${entryId}`)
      return response.data
    },
  })
}
