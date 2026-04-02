import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function parseContent(text: string): { text: string; hasHashtags: boolean; hasMentions: boolean } {
  const hashtags = /#\w+/g.test(text)
  const mentions = /@\w+/g.test(text)
  return { text, hasHashtags: hashtags, hasMentions: mentions }
}

export function extractHashtags(text: string): string[] {
  const matches = text.match(/#\w+/g)
  return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : []
}

export function extractMentions(text: string): string[] {
  const matches = text.match(/@\w+/g)
  return matches ? matches.map(mention => mention.slice(1).toLowerCase()) : []
}

export function canEditPost(createdAt: string): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const minutesSince = (now.getTime() - created.getTime()) / (1000 * 60)
  return minutesSince <= 30
}

export function canDeletePost(createdAt: string): { canDelete: boolean; canRequestDelete: boolean } {
  const created = new Date(createdAt)
  const now = new Date()
  const minutesSince = (now.getTime() - created.getTime()) / (1000 * 60)
  
  if (minutesSince <= 30) {
    return { canDelete: true, canRequestDelete: false }
  }
  return { canDelete: false, canRequestDelete: true }
}
