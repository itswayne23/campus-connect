import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useCreatePost } from '@/hooks/use-posts'
import { useDraft, useSaveDraft, useClearDraft } from '@/hooks/use-drafts'
import { useMentionSuggestions, insertMention } from '@/components/feed/content-renderer'
import { uploadMedia } from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Image, Video, Globe, Lock, Send, X, Loader2, BarChart3, Plus, Trash2, Save, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import type { User, PollOption } from '@/types'

interface MediaItem {
  url: string
  type: 'image' | 'video'
}

interface PollDraft {
  question: string
  options: PollOption[]
}

export function PostComposer() {
  const { user } = useAuthStore()
  const createPost = useCreatePost()
  const { data: draft } = useDraft()
  const saveDraft = useSaveDraft()
  const clearDraft = useClearDraft()
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showPoll, setShowPoll] = useState(false)
  const [poll, setPoll] = useState<PollDraft>({ question: '', options: [{ id: '1', text: '', votes: 0 }, { id: '2', text: '', votes: 0 }] })
  const [hasDraft, setHasDraft] = useState(false)
  const [location, setLocation] = useState('')
  const [showLocation, setShowLocation] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const draftTimeoutRef = useRef<NodeJS.Timeout>()

  const { suggestions, isLoading: loadingMentions } = useMentionSuggestions(content, cursorPosition)

  useEffect(() => {
    if (draft && draft.content) {
      setContent(draft.content)
      setIsAnonymous(draft.is_anonymous)
      if (draft.poll_data) {
        setShowPoll(true)
        setPoll({
          question: draft.poll_data.question || '',
          options: draft.poll_data.options || [{ id: '1', text: '', votes: 0 }, { id: '2', text: '', votes: 0 }]
        })
      }
      setHasDraft(true)
    }
  }, [draft])

  useEffect(() => {
    if (draftTimeoutRef.current) {
      clearTimeout(draftTimeoutRef.current)
    }
    
    if (content || media.length > 0 || (showPoll && poll.question)) {
      draftTimeoutRef.current = setTimeout(() => {
        saveDraft.mutate({
          content,
          media_urls: media.map(m => m.url),
          poll_data: showPoll && poll.question ? poll : undefined,
          is_anonymous: isAnonymous
        })
      }, 2000)
    }
    
    return () => {
      if (draftTimeoutRef.current) {
        clearTimeout(draftTimeoutRef.current)
      }
    }
  }, [content, media, poll, showPoll, isAnonymous])

  const handleSubmit = async () => {
    if (!content.trim() && media.length === 0 && !showPoll) return
    
    const validOptions = poll.options.filter(o => o.text.trim())
    if (showPoll && (!poll.question.trim() || validOptions.length < 2)) {
      toast.error('Poll must have a question and at least 2 options')
      return
    }

    const mediaUrls = media.map(m => m.url)

    const postPayload: any = {
      content: content.trim(),
      is_anonymous: isAnonymous,
      media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
    }

    if (showPoll && poll.question.trim()) {
      postPayload.poll = {
        question: poll.question.trim(),
        options: validOptions.map((o, i) => ({ text: o.text.trim(), votes: 0 })),
        is_multiple_choice: false
      }
    }

    if (location.trim()) {
      postPayload.location = location.trim()
    }

    createPost.mutate(postPayload, {
      onSuccess: () => {
        setContent('')
        setIsAnonymous(false)
        setMedia([])
        setShowPoll(false)
        setPoll({ question: '', options: [{ id: '1', text: '', votes: 0 }, { id: '2', text: '', votes: 0 }] })
        setLocation('')
        setShowLocation(false)
        clearDraft.mutate()
        setHasDraft(false)
        toast.success('Post created!')
      },
    })
  }

  const handleDiscardDraft = () => {
    setContent('')
    setIsAnonymous(false)
    setMedia([])
    setShowPoll(false)
    setPoll({ question: '', options: [{ id: '1', text: '', votes: 0 }, { id: '2', text: '', votes: 0 }] })
    setLocation('')
    setShowLocation(false)
    clearDraft.mutate()
    setHasDraft(false)
  }

  const addPollOption = () => {
    if (poll.options.length < 6) {
      setPoll(prev => ({
        ...prev,
        options: [...prev.options, { id: String(prev.options.length + 1), text: '', votes: 0 }]
      }))
    }
  }

  const removePollOption = (id: string) => {
    if (poll.options.length > 2) {
      setPoll(prev => ({
        ...prev,
        options: prev.options.filter(o => o.id !== id)
      }))
    }
  }

  const updatePollOption = (id: string, text: string) => {
    setPoll(prev => ({
      ...prev,
      options: prev.options.map(o => o.id === id ? { ...o, text } : o)
    }))
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
          {hasDraft && (
            <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-md">
              <div className="flex items-center gap-1.5">
                <Save className="h-3 w-3" />
                <span>Draft restored</span>
              </div>
              <Button variant="ghost" size="sm" className="h-5 text-xs" onClick={handleDiscardDraft}>
                Discard
              </Button>
            </div>
          )}
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

          {showPoll && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Add Poll
                </span>
                <Button variant="ghost" size="sm" onClick={() => setShowPoll(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <input
                type="text"
                placeholder="Ask a question..."
                value={poll.question}
                onChange={(e) => setPoll(prev => ({ ...prev, question: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-2 space-y-2">
                {poll.options.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <span className="text-sm text-gray-400">{String.fromCharCode(65 + index)}.</span>
                      <input
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        value={option.text}
                        onChange={(e) => updatePollOption(option.id, e.target.value)}
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                      />
                    </div>
                    {poll.options.length > 2 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removePollOption(option.id)}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {poll.options.length < 6 && (
                <Button variant="ghost" size="sm" onClick={addPollOption} className="mt-2 text-blue-500">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              )}
            </div>
          )}

          {showLocation && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-500" />
                <input
                  type="text"
                  placeholder="Add location (e.g., Library, Main Campus)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button variant="ghost" size="sm" onClick={() => setShowLocation(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
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
              
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-9 w-9 rounded-full ${showPoll ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-950'}`}
                onClick={() => setShowPoll(!showPoll)}
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
              
              <span className="text-xs text-gray-400 px-2">
                Use # for hashtags, @ to mention
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-9 w-9 rounded-full ${showLocation ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300' : 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950'}`}
                onClick={() => setShowLocation(!showLocation)}
              >
                <MapPin className="h-5 w-5" />
              </Button>
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
