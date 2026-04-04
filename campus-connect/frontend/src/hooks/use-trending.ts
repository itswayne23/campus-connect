import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface TrendingTopic {
  hashtag: string
  post_count: number
  trend_score: number
  recent_posts: number
}

interface TrendingCategory {
  name: string
  post_count: number
  trend_score: number
}

interface TrendingResponse {
  topics: TrendingTopic[]
  categories: TrendingCategory[]
  last_updated: string
}

export function useTrending(limit: number = 10) {
  return useQuery({
    queryKey: ['trending', limit],
    queryFn: async () => {
      const response = await api.get<TrendingResponse>(`/trending?limit=${limit}`)
      return response.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useTrendingByHashtag(hashtag: string, limit: number = 20) {
  return useQuery({
    queryKey: ['trending-hashtag', hashtag],
    queryFn: async () => {
      const response = await api.get(`/trending/hashtag/${hashtag}?limit=${limit}`)
      return response.data
    },
    enabled: !!hashtag,
  })
}
