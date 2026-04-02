import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock API at the top level
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      data: {
        id: 'user-123',
        username: 'testuser',
        avatar_url: null,
      }
    }),
  },
}))

describe('ContentRenderer', () => {
  it('should be defined', async () => {
    const { ContentRenderer } = await import('@/components/feed/content-renderer')
    expect(ContentRenderer).toBeDefined()
  })
})

describe('PostCard', () => {
  it('should be defined', async () => {
    const { PostCard } = await import('@/components/feed/post-card')
    expect(PostCard).toBeDefined()
  })
})

describe('PostComposer', () => {
  it('should be defined', async () => {
    const { PostComposer } = await import('@/components/feed/post-composer')
    expect(PostComposer).toBeDefined()
  })
})

describe('AnonymousComposer', () => {
  it('should be defined', async () => {
    const { AnonymousComposer } = await import('@/components/anonymous/anonymous-composer')
    expect(AnonymousComposer).toBeDefined()
  })
})

describe('Utility Functions', () => {
  it('should extract hashtags from text', async () => {
    const { extractHashtags } = await import('@/lib/utils')
    const result = extractHashtags('Hello #world and #react')
    expect(result).toContain('world')
    expect(result).toContain('react')
  })

  it('should extract mentions from text', async () => {
    const { extractMentions } = await import('@/lib/utils')
    const result = extractMentions('Hello @john and @jane')
    expect(result).toContain('john')
    expect(result).toContain('jane')
  })

  it('should format recent dates', async () => {
    const { formatDate } = await import('@/lib/utils')
    const now = new Date().toISOString()
    expect(formatDate(now)).toBe('just now')
  })

  it('should truncate long text', async () => {
    const { truncateText } = await import('@/lib/utils')
    const result = truncateText('Hello world this is a test', 10)
    expect(result).toBe('Hello worl...')
  })
})
