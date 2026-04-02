import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useCreatePost } from '@/hooks/use-posts'
import { useMentionSuggestions, insertMention } from '@/components/feed/content-renderer'
import { uploadMedia } from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { Image, Video, Globe, Lock, Send, X, Loader2, AtSign } from 'lucide-react'
import { toast } from 'sonner'
import type { User } from '@/types'

interface MediaItem {
  url: string
  type: 'image' | 'video'
}

export function PostComposer() {
  const { user } = useAuthStore()
  const createPost = useCreatePost()
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { suggestions, isLoading: loadingMentions } = useMentionSuggestions(content, cursorPosition)

  useEffect(() => {
    setShowMentions(suggestions.length > 0)
  }, [suggestions])

  const handleSubmit = async () => {
    if (!content.trim() && media.length === 0) return

    const mediaUrls = media.map(m => m.url)

    createPost.mutate({
      content: content.trim(),
      is_anonymous: isAnonymous,
      media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
    }, {
      onSuccess: () => {
        setContent('')
        setIsAnonymous(false)
        setMedia([])
        toast.success('Post created!')
      },
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (type === 'image' && !file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (type === 'video' && !file.type.startsWith('video/')) {
      toast.error('Please select a video file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setUploading(true)
    try {
      const result = await uploadMedia(file)
      setMedia(prev => [...prev, { url: result.url, type }])
      toast.success(`${type === 'image' ? 'Image' : 'Video'} uploaded!`)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || `Failed to upload ${type}`)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index))
  }

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase()
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    setCursorPosition(e.target.selectionStart || 0)
  }

  const handleTextareaSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = e.target as HTMLTextAreaElement
    setCursorPosition(textarea.selectionStart || 0)
  }

  const handleMentionSelect = useCallback((selectedUser: User) => {
    const { newText, newCursorPosition } = insertMention(content, cursorPosition, selectedUser.username)
    setContent(newText)
    setShowMentions(false)
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }, [content, cursorPosition])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && suggestions.length > 0) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowMentions(false)
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        handleMentionSelect(suggestions[0].user)
      }
    }
  }

  const isSubmitDisabled = (!content.trim() && media.length === 0) || createPost.isPending

  return (
    <Card className="p-4 shadow-md border-0">
      <div className="flex gap-3">
        <Avatar className="h-12 w-12 ring-2 ring-gray-100 dark:ring-gray-800">
          {user?.avatar_url ? (
            <AvatarImage src={user.avatar_url} alt={user.username} />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
              {user ? getInitials(user.username) : 'U'}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder={`What's on your mind, ${user?.username || 'there'}?`}
              value={content}
              onChange={handleTextareaChange}
              onSelect={handleTextareaSelect}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] resize-none border-none focus-visible:ring-0 p-0 text-base bg-transparent"
            />
            
            {showMentions && (
              <div className="absolute z-50 top-full mt-1 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loadingMentions ? (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                ) : (
                  suggestions.map(({ user: suggestionUser }) => (
                    <button
                      key={suggestionUser.id}
                      onClick={() => handleMentionSelect(suggestionUser)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <Avatar className="h-8 w-8">
                        {suggestionUser.avatar_url ? (
                          <AvatarImage src={suggestionUser.avatar_url} />
                        ) : (
                          <AvatarFallback className="text-xs">
                            {getInitials(suggestionUser.username)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{suggestionUser.username}</p>
                        {suggestionUser.bio && (
                          <p className="text-xs text-muted-foreground truncate">{suggestionUser.bio}</p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {media.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {media.map((item, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden">
                  {item.type === 'image' ? (
                    <img src={item.url} alt="upload" className="w-full h-32 object-cover" />
                  ) : (
                    <video src={item.url} className="w-full h-32 object-cover" controls />
                  )}
                  <button
                    onClick={() => removeMedia(index)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'image')}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'video')}
              />
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Image className="h-5 w-5" />}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-full text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950"
                onClick={() => videoInputRef.current?.click()}
                disabled={uploading}
              >
                <Video className="h-5 w-5" />
              </Button>
              
              <span className="text-xs text-gray-400 px-2">
                Use # for hashtags, @ to mention
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={isAnonymous ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`rounded-full ${isAnonymous ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300' : ''}`}
              >
                {isAnonymous ? <Lock className="h-4 w-4 mr-1.5" /> : <Globe className="h-4 w-4 mr-1.5" />}
                {isAnonymous ? 'Anonymous' : 'Public'}
              </Button>

              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitDisabled}
                className="rounded-full px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {createPost.isPending ? (
                  'Posting...'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1.5" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
