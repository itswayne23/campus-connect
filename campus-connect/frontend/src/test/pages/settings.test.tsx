import { describe, it, expect, vi } from 'vitest'

vi.mock('@/hooks/use-users', () => ({
  useUpdateProfile: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useUploadAvatar: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useDeleteAvatar: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useUserByUsername: vi.fn(() => ({
    data: null,
    isLoading: false,
  })),
}))

describe('SettingsPage', () => {
  it('should be defined', async () => {
    const { SettingsPage } = await import('@/pages/settings')
    expect(SettingsPage).toBeDefined()
  })
})

describe('useUploadAvatar', () => {
  it('should be defined', async () => {
    const { useUploadAvatar } = await import('@/hooks/use-users')
    expect(useUploadAvatar).toBeDefined()
  })
})

describe('useDeleteAvatar', () => {
  it('should be defined', async () => {
    const { useDeleteAvatar } = await import('@/hooks/use-users')
    expect(useDeleteAvatar).toBeDefined()
  })
})

describe('useUserByUsername', () => {
  it('should be defined', async () => {
    const { useUserByUsername } = await import('@/hooks/use-users')
    expect(useUserByUsername).toBeDefined()
  })
})
