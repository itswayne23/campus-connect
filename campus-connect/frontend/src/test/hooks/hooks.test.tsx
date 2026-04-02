import { describe, it, expect } from 'vitest'

describe('Auth Hooks', () => {
  it('should export useLogin', async () => {
    const { useLogin } = await import('@/hooks/use-auth')
    expect(useLogin).toBeDefined()
  })

  it('should export useRegister', async () => {
    const { useRegister } = await import('@/hooks/use-auth')
    expect(useRegister).toBeDefined()
  })

  it('should export useLogout', async () => {
    const { useLogout } = await import('@/hooks/use-auth')
    expect(useLogout).toBeDefined()
  })

  it('should export useCurrentUser', async () => {
    const { useCurrentUser } = await import('@/hooks/use-auth')
    expect(useCurrentUser).toBeDefined()
  })
})

describe('Posts Hooks', () => {
  it('should export useFeed', async () => {
    const { useFeed } = await import('@/hooks/use-posts')
    expect(useFeed).toBeDefined()
  })

  it('should export useCreatePost', async () => {
    const { useCreatePost } = await import('@/hooks/use-posts')
    expect(useCreatePost).toBeDefined()
  })

  it('should export useLikePost', async () => {
    const { useLikePost } = await import('@/hooks/use-posts')
    expect(useLikePost).toBeDefined()
  })

  it('should export useComments', async () => {
    const { useComments } = await import('@/hooks/use-posts')
    expect(useComments).toBeDefined()
  })

  it('should export useBookmarkPost', async () => {
    const { useBookmarkPost } = await import('@/hooks/use-posts')
    expect(useBookmarkPost).toBeDefined()
  })
})

describe('Users Hooks', () => {
  it('should export useUser', async () => {
    const { useUser } = await import('@/hooks/use-users')
    expect(useUser).toBeDefined()
  })

  it('should export useUpdateProfile', async () => {
    const { useUpdateProfile } = await import('@/hooks/use-users')
    expect(useUpdateProfile).toBeDefined()
  })

  it('should export useFollowUser', async () => {
    const { useFollowUser } = await import('@/hooks/use-users')
    expect(useFollowUser).toBeDefined()
  })

  it('should export useUnfollowUser', async () => {
    const { useUnfollowUser } = await import('@/hooks/use-users')
    expect(useUnfollowUser).toBeDefined()
  })
})

describe('Messages Hooks', () => {
  it('should export useConversations', async () => {
    const { useConversations } = await import('@/hooks/use-messages')
    expect(useConversations).toBeDefined()
  })

  it('should export useMessages', async () => {
    const { useMessages } = await import('@/hooks/use-messages')
    expect(useMessages).toBeDefined()
  })

  it('should export useSendMessage', async () => {
    const { useSendMessage } = await import('@/hooks/use-messages')
    expect(useSendMessage).toBeDefined()
  })
})

describe('Notifications Hooks', () => {
  it('should export useNotifications', async () => {
    const { useNotifications } = await import('@/hooks/use-notifications')
    expect(useNotifications).toBeDefined()
  })

  it('should export useMarkAllNotificationsRead', async () => {
    const { useMarkAllNotificationsRead } = await import('@/hooks/use-notifications')
    expect(useMarkAllNotificationsRead).toBeDefined()
  })
})
