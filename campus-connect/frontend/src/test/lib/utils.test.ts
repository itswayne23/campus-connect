import { describe, it, expect } from 'vitest'
import {
  cn,
  formatDate,
  truncateText,
  parseContent,
  extractHashtags,
  extractMentions,
  canEditPost,
  canDeletePost,
} from '@/lib/utils'

describe('Utility Functions', () => {
  describe('cn (class name merger)', () => {
    it('should merge class names correctly', () => {
      const result = cn('class1', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      const condition = true
      const result = cn('base-class', condition && 'conditional-class')
      expect(result).toContain('base-class')
      expect(result).toContain('conditional-class')
    })

    it('should handle empty inputs', () => {
      const result = cn()
      expect(result).toBe('')
    })
  })

  describe('formatDate', () => {
    it('should return "just now" for dates less than a minute ago', () => {
      const now = new Date().toISOString()
      expect(formatDate(now)).toBe('just now')
    })

    it('should return minutes ago for dates less than an hour ago', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      expect(formatDate(date)).toBe('5m ago')
    })

    it('should return hours ago for dates less than a day ago', () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      expect(formatDate(date)).toBe('3h ago')
    })

    it('should return days ago for dates less than a week ago', () => {
      const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      expect(formatDate(date)).toBe('2d ago')
    })

    it('should return formatted date for dates more than a week ago', () => {
      const date = new Date('2023-01-15').toISOString()
      const result = formatDate(date)
      expect(result).toMatch(/Jan 15/)
    })

    it('should accept Date objects', () => {
      const now = new Date()
      expect(formatDate(now)).toBe('just now')
    })
  })

  describe('truncateText', () => {
    it('should not truncate text shorter than maxLength', () => {
      expect(truncateText('hello', 10)).toBe('hello')
    })

    it('should truncate text longer than maxLength', () => {
      expect(truncateText('hello world', 5)).toBe('hello...')
    })

    it('should handle exact length', () => {
      expect(truncateText('hello', 5)).toBe('hello')
    })
  })

  describe('parseContent', () => {
    it('should detect hashtags and mentions', () => {
      const result = parseContent('Hello @user and #hashtag')
      expect(result.hasHashtags).toBe(true)
      expect(result.hasMentions).toBe(true)
    })

    it('should not detect hashtags in plain text', () => {
      const result = parseContent('Hello world')
      expect(result.hasHashtags).toBe(false)
      expect(result.hasMentions).toBe(false)
    })

    it('should return original text', () => {
      const text = 'Original text'
      expect(parseContent(text).text).toBe(text)
    })
  })

  describe('extractHashtags', () => {
    it('should extract hashtags from text', () => {
      const result = extractHashtags('Hello #world and #react')
      expect(result).toEqual(['world', 'react'])
    })

    it('should return lowercase hashtags', () => {
      const result = extractHashtags('Hello #WORLD')
      expect(result).toEqual(['world'])
    })

    it('should return empty array for no hashtags', () => {
      const result = extractHashtags('Hello world')
      expect(result).toEqual([])
    })
  })

  describe('extractMentions', () => {
    it('should extract mentions from text', () => {
      const result = extractMentions('Hello @john and @jane')
      expect(result).toEqual(['john', 'jane'])
    })

    it('should return lowercase mentions', () => {
      const result = extractMentions('Hello @JOHN')
      expect(result).toEqual(['john'])
    })

    it('should return empty array for no mentions', () => {
      const result = extractMentions('Hello world')
      expect(result).toEqual([])
    })
  })

  describe('canEditPost', () => {
    it('should return true for posts less than 30 minutes old', () => {
      const recentDate = new Date(Date.now() - 15 * 60 * 1000).toISOString()
      expect(canEditPost(recentDate)).toBe(true)
    })

    it('should return false for posts more than 30 minutes old', () => {
      const oldDate = new Date(Date.now() - 31 * 60 * 1000).toISOString()
      expect(canEditPost(oldDate)).toBe(false)
    })
  })

  describe('canDeletePost', () => {
    it('should allow direct delete for recent posts', () => {
      const recentDate = new Date(Date.now() - 15 * 60 * 1000).toISOString()
      const result = canDeletePost(recentDate)
      expect(result.canDelete).toBe(true)
      expect(result.canRequestDelete).toBe(false)
    })

    it('should allow delete request for old posts', () => {
      const oldDate = new Date(Date.now() - 31 * 60 * 1000).toISOString()
      const result = canDeletePost(oldDate)
      expect(result.canDelete).toBe(false)
      expect(result.canRequestDelete).toBe(true)
    })

    it('should allow direct delete at exactly 30 minutes', () => {
      const date = new Date(Date.now() - 30 * 60 * 1000).toISOString()
      const result = canDeletePost(date)
      expect(result.canDelete).toBe(true)
      expect(result.canRequestDelete).toBe(false)
    })
  })
})
