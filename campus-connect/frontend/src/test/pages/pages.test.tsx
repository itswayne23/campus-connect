import { describe, it, expect } from 'vitest'

describe('Pages', () => {
  it('should export LoginPage', async () => {
    const { LoginPage } = await import('@/pages/auth/login')
    expect(LoginPage).toBeDefined()
  })

  it('should export RegisterPage', async () => {
    const { RegisterPage } = await import('@/pages/auth/register')
    expect(RegisterPage).toBeDefined()
  })

  it('should export HomePage', async () => {
    const { HomePage } = await import('@/pages/home')
    expect(HomePage).toBeDefined()
  })

  it('should export ExplorePage', async () => {
    const { ExplorePage } = await import('@/pages/explore')
    expect(ExplorePage).toBeDefined()
  })

  it('should export ProfilePage', async () => {
    const { ProfilePage } = await import('@/pages/profile')
    expect(ProfilePage).toBeDefined()
  })

  it('should export MessagesPage', async () => {
    const { MessagesPage } = await import('@/pages/messages')
    expect(MessagesPage).toBeDefined()
  })

  it('should export NotificationsPage', async () => {
    const { NotificationsPage } = await import('@/pages/notifications')
    expect(NotificationsPage).toBeDefined()
  })

  it('should export SettingsPage', async () => {
    const { SettingsPage } = await import('@/pages/settings')
    expect(SettingsPage).toBeDefined()
  })

  it('should export BookmarksPage', async () => {
    const { BookmarksPage } = await import('@/pages/bookmarks')
    expect(BookmarksPage).toBeDefined()
  })

  it('should export AnonymousPage', async () => {
    const { AnonymousPage } = await import('@/pages/anonymous')
    expect(AnonymousPage).toBeDefined()
  })

  it('should export FollowersPage', async () => {
    const { FollowersPage } = await import('@/pages/followers')
    expect(FollowersPage).toBeDefined()
  })

  it('should export FollowingPage', async () => {
    const { FollowingPage } = await import('@/pages/following')
    expect(FollowingPage).toBeDefined()
  })

  it('should export AdminPage', async () => {
    const { AdminPage } = await import('@/pages/admin')
    expect(AdminPage).toBeDefined()
  })
})
