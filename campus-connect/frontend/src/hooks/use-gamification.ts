import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface UserStats {
  user_id: string
  username: string
  avatar_url: string | null
  total_points: number
  current_streak: number
  longest_streak: number
  posts_count: number
  likes_received: number
  comments_count: number
  followers_count: number
  achievements_count: number
  rank: number
  level: number
}

export interface LeaderboardEntry {
  rank: number
  user_id: string
  username: string
  avatar_url: string | null
  total_points: number
  current_streak: number
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[]
  user_rank: number | null
  time_period: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string | null
  category: string
  points_required: number
  badge_type: string
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  achievement: Achievement
  earned_at: string
}

export interface GamificationStats {
  user_stats: UserStats
  recent_achievements: UserAchievement[]
  recent_transactions: Array<{
    id: string
    user_id: string
    points: number
    reason: string
    created_at: string
  }>
}

export function useUserGamificationStats() {
  return useQuery({
    queryKey: ['gamification', 'stats'],
    queryFn: async () => {
      const response = await api.get<UserStats>('/gamification/stats')
      return response.data
    },
  })
}

export function useLeaderboard(timePeriod: string = 'all_time') {
  return useQuery({
    queryKey: ['gamification', 'leaderboard', timePeriod],
    queryFn: async () => {
      const response = await api.get<LeaderboardResponse>(`/gamification/leaderboard?time_period=${timePeriod}`)
      return response.data
    },
  })
}

export function useUserAchievements() {
  return useQuery({
    queryKey: ['gamification', 'achievements'],
    queryFn: async () => {
      const response = await api.get<UserAchievement[]>('/gamification/achievements')
      return response.data
    },
  })
}

export function useAllAchievements() {
  return useQuery({
    queryKey: ['gamification', 'achievements', 'all'],
    queryFn: async () => {
      const response = await api.get<Achievement[]>('/gamification/achievements/all')
      return response.data
    },
  })
}

export function useGamificationFull() {
  return useQuery({
    queryKey: ['gamification', 'full'],
    queryFn: async () => {
      const response = await api.get<GamificationStats>('/gamification/full')
      return response.data
    },
  })
}
