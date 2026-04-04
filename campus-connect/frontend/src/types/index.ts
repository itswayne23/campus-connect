export interface User {
  id: string
  email: string
  username: string
  avatar_url: string | null
  bio: string | null
  university: string | null
  role?: string
  is_verified?: boolean
  followers_count: number
  following_count: number
  posts_count: number
  is_following: boolean
  is_blocked?: boolean
  is_muted?: boolean
  is_own_profile?: boolean
  created_at: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: string
  earned_at: string | null
}

export interface UserBadges {
  badges: Badge[]
  total_badges: number
}

export interface AnalyticsSummary {
  total_posts: number
  total_likes_received: number
  total_comments_received: number
  total_reposts_received: number
  total_followers: number
  total_following: number
  avg_engagement_rate: number
}

export interface FollowerStat {
  date: string
  follower_count: number
}

export interface FollowerGrowth {
  stats: FollowerStat[]
  current_followers: number
  growth_percentage: number
}

export interface PostInsight {
  post_id: string
  views: number
  unique_views: number
  impressions: number
  likes_count: number
  comments_count: number
  reposts_count: number
}

export interface PostAnalytics {
  insights: PostInsight[]
  top_performing_post: PostInsight | null
  total_views: number
  avg_likes_per_post: number
}

export interface AnalyticsDashboard {
  summary: AnalyticsSummary
  follower_growth: FollowerGrowth
  post_analytics: PostAnalytics
}

export interface Post {
  id: string
  author_id: string | null
  author: {
    id: string
    username: string
    avatar_url: string | null
  } | null
  content: string
  media_urls: string[]
  is_anonymous: boolean
  anonymous_name: string | null
  category: string | null
  poll: Poll | null
  repost_count: number
  is_reposted: boolean
  likes_count: number
  comments_count: number
  is_liked: boolean
  is_bookmarked: boolean
  created_at: string
  updated_at: string
}

export interface PollOption {
  id: string
  text: string
  votes: number
}

export interface Poll {
  id: string
  question: string
  options: PollOption[]
  expires_at: string | null
  is_multiple_choice: boolean
  total_votes: number
  voted_option_id: string | null
}

export interface Comment {
  id: string
  post_id: string
  author_id: string | null
  author: {
    id: string
    username: string
    avatar_url: string | null
  } | null
  content: string
  is_anonymous: boolean
  anonymous_name: string | null
  parent_id: string | null
  replies: Comment[]
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  media_url: string | null
  is_read: boolean
  created_at: string
}

export interface Conversation {
  user_id: string
  username: string
  avatar_url: string | null
  last_message: Message | null
  unread_count: number
}

export interface Notification {
  id: string
  user_id: string
  type: 'like' | 'comment' | 'follow' | 'message' | 'mention'
  actor_id: string | null
  actor: {
    id: string
    username: string
    avatar_url: string | null
  } | null
  post_id: string | null
  post: {
    id: string
    content: string
  } | null
  is_read: boolean
  created_at: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface PostFeedResponse {
  posts: Post[]
  has_more: boolean
  next_cursor: string | null
}

export type PostCategory = 'complaint' | 'suggestion' | 'experience' | 'qna' | 'general'

export interface Story {
  id: string
  user_id: string
  user: {
    id: string
    username: string
    avatar_url: string | null
  } | null
  media_url: string
  media_type: 'image' | 'video'
  caption: string | null
  view_count: number
  has_viewed: boolean
  created_at: string
  expires_at: string
}

export interface UserStories {
  user: {
    id: string
    username: string
    avatar_url: string | null
  }
  stories: Story[]
}
