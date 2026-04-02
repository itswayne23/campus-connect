import { http, HttpResponse } from 'msw'
import type { User, Post, Message, Conversation, Notification } from '@/types'

const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'john@example.com',
    username: 'johndoe',
    avatar_url: 'https://i.pravatar.cc/150?u=john',
    bio: 'Software developer passionate about building great products',
    university: 'MIT',
    followers_count: 150,
    following_count: 75,
    posts_count: 45,
    is_following: false,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'user-2',
    email: 'jane@example.com',
    username: 'janedoe',
    avatar_url: 'https://i.pravatar.cc/150?u=jane',
    bio: 'Designer and creative thinker',
    university: 'Stanford',
    followers_count: 200,
    following_count: 100,
    posts_count: 60,
    is_following: true,
    created_at: '2024-01-20T10:00:00Z',
  },
  {
    id: 'user-3',
    email: 'alex@example.com',
    username: 'alexsmith',
    avatar_url: null,
    bio: 'Student exploring the world',
    university: 'Harvard',
    followers_count: 50,
    following_count: 30,
    posts_count: 20,
    is_following: false,
    created_at: '2024-02-01T10:00:00Z',
  },
]

const mockPosts: Post[] = [
  {
    id: 'post-1',
    author_id: 'user-2',
    author: mockUsers[1],
    content: 'Hello everyone! This is my first post. #welcome #campus',
    media_urls: [],
    is_anonymous: false,
    anonymous_name: null,
    category: null,
    likes_count: 25,
    comments_count: 5,
    is_liked: false,
    is_bookmarked: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'post-2',
    author_id: 'user-1',
    author: mockUsers[0],
    content: 'Great day on campus! @janedoe check this out #college #fun',
    media_urls: ['https://picsum.photos/600/400'],
    is_anonymous: false,
    anonymous_name: null,
    category: null,
    likes_count: 42,
    comments_count: 8,
    is_liked: true,
    is_bookmarked: false,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
]

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    sender_id: 'user-2',
    receiver_id: 'user-1',
    content: 'Hey! How are you doing?',
    media_url: null,
    is_read: true,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-2',
    sender_id: 'user-1',
    receiver_id: 'user-2',
    content: 'Doing great! Just finished my assignment.',
    media_url: null,
    is_read: true,
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-3',
    sender_id: 'user-2',
    receiver_id: 'user-1',
    content: 'Nice! Want to grab coffee later?',
    media_url: null,
    is_read: false,
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
]

const mockConversations: Conversation[] = [
  {
    user_id: 'user-2',
    username: 'janedoe',
    avatar_url: 'https://i.pravatar.cc/150?u=jane',
    last_message: mockMessages[2],
    unread_count: 1,
  },
]

const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    user_id: 'user-1',
    type: 'like',
    actor_id: 'user-2',
    actor: mockUsers[1],
    post_id: 'post-1',
    post: { id: 'post-1', content: 'My first post!' },
    is_read: false,
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    user_id: 'user-1',
    type: 'follow',
    actor_id: 'user-3',
    actor: mockUsers[2],
    post_id: null,
    post: null,
    is_read: true,
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
]

export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    if (body.email && body.password) {
      return HttpResponse.json({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'Bearer',
        user: mockUsers[0],
      })
    }
    return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 })
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'Bearer',
      user: { ...mockUsers[0], email: (body as any).email },
    })
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json(mockUsers[0])
  }),

  // Posts endpoints
  http.get('/api/posts/feed', () => {
    return HttpResponse.json({
      posts: mockPosts,
      has_more: false,
      next_cursor: null,
    })
  }),

  http.get('/api/posts/explore', () => {
    return HttpResponse.json({
      posts: mockPosts,
      has_more: false,
      next_cursor: null,
    })
  }),

  http.post('/api/posts', async ({ request }) => {
    const body = await request.json() as { content: string }
    const newPost: Post = {
      id: `post-${Date.now()}`,
      author_id: 'user-1',
      author: mockUsers[0],
      content: body.content,
      media_urls: [],
      is_anonymous: false,
      anonymous_name: null,
      category: null,
      likes_count: 0,
      comments_count: 0,
      is_liked: false,
      is_bookmarked: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return HttpResponse.json(newPost)
  }),

  http.post('/api/posts/:postId/like', () => {
    return HttpResponse.json({ success: true, is_liked: true })
  }),

  http.delete('/api/posts/:postId/like', () => {
    return HttpResponse.json({ success: true, is_liked: false })
  }),

  // Users endpoints
  http.get('/api/users/:userId', ({ params }) => {
    const user = mockUsers.find(u => u.id === params.userId)
    if (user) {
      return HttpResponse.json(user)
    }
    return HttpResponse.json({ detail: 'User not found' }, { status: 404 })
  }),

  http.get('/api/users/username/:username', ({ params }) => {
    const user = mockUsers.find(u => u.username === params.username)
    if (user) {
      return HttpResponse.json(user)
    }
    return HttpResponse.json({ detail: 'User not found' }, { status: 404 })
  }),

  http.put('/api/users/:userId', async ({ request }) => {
    const body = await request.json()
    const updatedUser = { ...mockUsers[0], ...body }
    return HttpResponse.json(updatedUser)
  }),

  http.get('/api/users/search', ({ request }) => {
    const q = new URL(request.url).searchParams.get('q') || ''
    const filtered = mockUsers.filter(u => 
      u.username.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase())
    )
    return HttpResponse.json(filtered)
  }),

  http.get('/api/users/:userId/posts', () => {
    return HttpResponse.json(mockPosts)
  }),

  http.post('/api/users/:userId/follow', () => {
    return HttpResponse.json({ success: true })
  }),

  http.delete('/api/users/:userId/follow', () => {
    return HttpResponse.json({ success: true })
  }),

  // Messages endpoints
  http.get('/api/messages', () => {
    return HttpResponse.json(mockConversations)
  }),

  http.get('/api/messages/:userId', ({ params }) => {
    const messages = mockMessages.filter(
      m => (m.sender_id === params.userId && m.receiver_id === 'user-1') ||
           (m.sender_id === 'user-1' && m.receiver_id === params.userId)
    )
    return HttpResponse.json(messages)
  }),

  http.post('/api/messages', async ({ request }) => {
    const body = await request.json() as { receiver_id: string; content: string }
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      sender_id: 'user-1',
      receiver_id: body.receiver_id,
      content: body.content,
      media_url: null,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    return HttpResponse.json(newMessage)
  }),

  // Notifications endpoints
  http.get('/api/notifications', () => {
    return HttpResponse.json({
      notifications: mockNotifications,
      unread_count: mockNotifications.filter(n => !n.is_read).length,
      has_more: false,
    })
  }),

  http.put('/api/notifications/read-all', () => {
    return HttpResponse.json({ success: true })
  }),
]

export const server = {
  listen: () => {},
  close: () => {},
}
