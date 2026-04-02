export interface User {
  id: string
  email: string
  username: string
  avatar_url: string | null
  bio: string | null
  university: string | null
  role?: string
  followers_count: number
  following_count: number
  posts_count: number
  is_following: boolean
  is_own_profile?: boolean
  created_at: string
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
  likes_count: number
  comments_count: number
  is_liked: boolean
  is_bookmarked: boolean
  created_at: string
  updated_at: string
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
