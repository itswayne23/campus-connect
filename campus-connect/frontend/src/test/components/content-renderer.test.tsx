import { describe, it, expect } from 'vitest'

describe('ContentRenderer', () => {
  it('should be defined', async () => {
    const { ContentRenderer } = await import('@/components/feed/content-renderer')
    expect(ContentRenderer).toBeDefined()
  })

  it('should export getHashtags function', async () => {
    const { getHashtags } = await import('@/components/feed/content-renderer')
    expect(getHashtags).toBeDefined()
  })

  it('should export getMentions function', async () => {
    const { getMentions } = await import('@/components/feed/content-renderer')
    expect(getMentions).toBeDefined()
  })

  it('should export useMentionSuggestions hook', async () => {
    const { useMentionSuggestions } = await import('@/components/feed/content-renderer')
    expect(useMentionSuggestions).toBeDefined()
  })

  it('should export insertMention function', async () => {
    const { insertMention } = await import('@/components/feed/content-renderer')
    expect(insertMention).toBeDefined()
    // Text with partial mention to replace
    const result = insertMention('Hello @jo', 9, 'john')
    expect(result.newText).toBe('Hello @john ')
  })
})

describe('Hashtag extraction', () => {
  it('should extract hashtags from text', async () => {
    const { getHashtags } = await import('@/components/feed/content-renderer')
    const result = getHashtags('Hello #world and #react')
    expect(result).toEqual(['world', 'react'])
  })

  it('should return empty array for no hashtags', async () => {
    const { getHashtags } = await import('@/components/feed/content-renderer')
    const result = getHashtags('Hello world')
    expect(result).toEqual([])
  })
})

describe('Mention extraction', () => {
  it('should extract mentions from text', async () => {
    const { getMentions } = await import('@/components/feed/content-renderer')
    const result = getMentions('Hello @john and @jane')
    expect(result).toEqual(['john', 'jane'])
  })

  it('should return empty array for no mentions', async () => {
    const { getMentions } = await import('@/components/feed/content-renderer')
    const result = getMentions('Hello world')
    expect(result).toEqual([])
  })
})
