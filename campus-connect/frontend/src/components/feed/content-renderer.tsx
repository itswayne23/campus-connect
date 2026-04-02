import { useMemo, useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { extractHashtags, extractMentions } from '@/lib/utils'
import type { User } from '@/types'

interface ContentRendererProps {
  content: string
  showHashtagLinks?: boolean
  showMentionLinks?: boolean
}

interface ParsedPart {
  type: 'text' | 'hashtag' | 'mention'
  value: string
  userId?: string
}

const userCache = new Map<string, User>()

export function ContentRenderer({ 
  content, 
  showHashtagLinks = true,
  showMentionLinks = true 
}: ContentRendererProps) {
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    const mentions = extractMentions(content)
    const uniqueMentions = [...new Set(mentions)]
    
    const fetchUsers = async () => {
      const newUserMap = new Map<string, string>()
      
      for (const username of uniqueMentions) {
        if (userCache.has(username)) {
          const user = userCache.get(username)!
          newUserMap.set(username, user.id)
        } else {
          try {
            const response = await api.get<User>(`/users/username/${encodeURIComponent(username)}`)
            const user = response.data
            userCache.set(username, user)
            newUserMap.set(username, user.id)
          } catch (error) {
            console.warn(`Failed to fetch user: ${username}`)
          }
        }
      }
      
      setUserMap(newUserMap)
    }

    if (uniqueMentions.length > 0) {
      fetchUsers()
    }
  }, [content])

  const parsedContent = useMemo(() => {
    const parts: ParsedPart[] = []
    const regex = /(@\w+|#\w+)/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          value: content.slice(lastIndex, match.index),
        })
      }

      const value = match[0]
      if (value.startsWith('@')) {
        const username = value.slice(1).toLowerCase()
        parts.push({
          type: 'mention',
          value: value,
          userId: userMap.get(username),
        })
      } else if (value.startsWith('#')) {
        parts.push({
          type: 'hashtag',
          value: value,
        })
      }

      lastIndex = match.index + value.length
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        value: content.slice(lastIndex),
      })
    }

    return parts
  }, [content, userMap])

  return (
    <div className="text-sm whitespace-pre-wrap break-words">
      {parsedContent.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index}>{part.value}</span>
        }
        
        if (part.type === 'hashtag' && showHashtagLinks) {
          return (
            <span
              key={index}
              className="text-blue-500 hover:underline font-medium cursor-pointer"
            >
              {part.value}
            </span>
          )
        }
        
        if (part.type === 'mention') {
          const username = part.value.slice(1).toLowerCase()
          
          if (showMentionLinks && part.userId) {
            return (
              <Link
                key={index}
                to={`/profile/${part.userId}`}
                className="text-blue-500 hover:underline font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                {part.value}
              </Link>
            )
          }
          
          return (
            <span
              key={index}
              className="text-blue-500 font-medium"
            >
              {part.value}
            </span>
          )
        }
        
        return null
      })}
    </div>
  )
}

export function getHashtags(content: string): string[] {
  return extractHashtags(content)
}

export function getMentions(content: string): string[] {
  return extractMentions(content)
}

interface MentionSuggestion {
  user: User
  matchStart: number
  matchEnd: number
}

export function useMentionSuggestions(inputText: string, cursorPosition: number) {
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    const textBeforeCursor = inputText.slice(0, cursorPosition)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)
    
    if (!mentionMatch) {
      setSuggestions([])
      return
    }

    const searchTerm = mentionMatch[1]

    debounceRef.current = setTimeout(async () => {
      if (searchTerm.length === 0) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      try {
        const response = await api.get<User[]>(`/users/search?q=${encodeURIComponent(searchTerm)}`)
        setSuggestions(
          response.data.map(user => ({
            user,
            matchStart: cursorPosition - searchTerm.length,
            matchEnd: cursorPosition,
          }))
        )
      } catch (error) {
        console.error('Failed to fetch mention suggestions:', error)
      } finally {
        setIsLoading(false)
      }
    }, 200)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [inputText, cursorPosition])

  return { suggestions, isLoading }
}

export function insertMention(
  text: string,
  cursorPosition: number,
  username: string
): { newText: string; newCursorPosition: number } {
  const textBeforeCursor = text.slice(0, cursorPosition)
  const textAfterCursor = text.slice(cursorPosition)
  const mentionMatch = textBeforeCursor.match(/@(\w*)$/)
  
  if (!mentionMatch) {
    return { newText: text, newCursorPosition: cursorPosition }
  }

  const matchStart = cursorPosition - mentionMatch[0].length
  const newTextBefore = text.slice(0, matchStart) + `@${username} `
  const newText = newTextBefore + textAfterCursor
  const newCursorPosition = newTextBefore.length

  return { newText, newCursorPosition }
}
