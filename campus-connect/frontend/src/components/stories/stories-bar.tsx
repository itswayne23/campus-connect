import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useStoriesFeed, useMyStories, useCreateStory, useViewStory } from '@/hooks/use-stories'
import { useAuthStore } from '@/store/auth-store'
import { Plus, X, ChevronLeft, ChevronRight, Image, Video, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function StoriesBar() {
  const { data: storiesData, isLoading } = useStoriesFeed()
  const { data: myStories } = useMyStories()
  const { user } = useAuthStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const getInitials = (name: string) => name.slice(0, 2).toUpperCase()

  const hasMyStory = myStories && myStories.length > 0

  return (
    <div className="relative group">
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background rounded-full shadow-md hidden group-hover:block"
        onClick={() => scroll('left')}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {user && (
          <Link to="#" onClick={() => setShowAddModal(true)} className="flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div className="relative">
                <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-blue-500 transition-colors">
                  {hasMyStory ? (
                    myStories[0].user?.avatar_url ? (
                      <Avatar>
                        <AvatarImage src={myStories[0].user.avatar_url} />
                      </Avatar>
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500">
                        {getInitials(user.username || 'U')}
                      </AvatarFallback>
                    )
                  ) : (
                    <Plus className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                {!hasMyStory && (
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <Plus className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <span className="text-xs text-center max-w-[60px] truncate">
                {hasMyStory ? 'Your Story' : 'Add Story'}
              </span>
            </div>
          </Link>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center w-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          storiesData?.map((userStories) => (
            <Link key={userStories.user.id} to={`/stories/${userStories.user.id}`} className="flex-shrink-0">
              <div className="flex flex-col items-center gap-1">
                <div className="relative">
                  <div className={`h-14 w-14 rounded-full p-[2px] ${
                    userStories.stories.some(s => !s.has_viewed)
                      ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    <div className="h-full w-full rounded-full bg-background p-[2px]">
                      <Avatar className="h-full w-full">
                        {userStories.user.avatar_url ? (
                          <AvatarImage src={userStories.user.avatar_url} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                            {getInitials(userStories.user.username)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                  </div>
                  {userStories.stories.length > 1 && (
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white font-medium">
                      {userStories.stories.length}
                    </div>
                  )}
                </div>
                <span className="text-xs text-center max-w-[60px] truncate">
                  {userStories.user.username}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background rounded-full shadow-md hidden group-hover:block"
        onClick={() => scroll('right')}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {showAddModal && (
        <AddStoryModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  )
}

function AddStoryModal({ onClose }: { onClose: () => void }) {
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const [caption, setCaption] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const createStory = useCreateStory()
  const { user } = useAuthStore()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isVideo = file.type.startsWith('video/')
    setMediaType(isVideo ? 'video' : 'image')

    const reader = new FileReader()
    reader.onload = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!preview) return

    setUploading(true)
    try {
      const token = useAuthStore.getState().accessToken
      const formData = new FormData()
      
      const response = await fetch(preview)
      const blob = await response.blob()
      const fileName = mediaType === 'video' ? 'video.mp4' : 'image.jpg'
      formData.append('file', blob, fileName)

      const uploadResponse = await fetch('/api/v1/stories/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      const { url } = await uploadResponse.json()

      await createStory.mutateAsync({
        media_url: url,
        media_type: mediaType,
        caption: caption || undefined
      })

      onClose()
    } catch (error) {
      toast.error('Failed to create story')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-background rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Create Story</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {!preview ? (
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Image className="h-6 w-6 text-blue-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                Click to upload an image or video
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden">
              {mediaType === 'video' ? (
                <video src={preview} className="w-full h-64 object-cover" controls />
              ) : (
                <img src={preview} alt="Preview" className="w-full h-64 object-cover" />
              )}
            </div>

            <textarea
              placeholder="Add a caption..."
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-background resize-none"
              rows={2}
            />

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={uploading || createStory.isPending}
            >
              {uploading || createStory.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                'Share Story'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
