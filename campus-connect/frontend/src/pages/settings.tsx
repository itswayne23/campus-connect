import { useState, useRef } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useUpdateProfile, useUploadAvatar, useDeleteAvatar } from '@/hooks/use-users'
import { toast } from 'sonner'
import { Camera, Upload, Trash2, Loader2 } from 'lucide-react'

export function SettingsPage() {
  const { user } = useAuthStore()
  const updateProfile = useUpdateProfile()
  const uploadAvatar = useUploadAvatar()
  const deleteAvatar = useDeleteAvatar()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [username, setUsername] = useState(user?.username || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [university, setUniversity] = useState(user?.university || '')
  const [showAvatarDialog, setShowAvatarDialog] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase()
  }

  const handleSave = () => {
    if (!user) return

    updateProfile.mutate(
      { username, bio, university },
      {
        onSuccess: () => {
          toast.success('Profile updated successfully!')
        },
        onError: () => {
          toast.error('Failed to update profile')
        },
      }
    )
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
      setShowAvatarDialog(true)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadAvatar = () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    uploadAvatar.mutate(file, {
      onSuccess: () => {
        setShowAvatarDialog(false)
        setPreviewUrl(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      },
    })
  }

  const handleRemoveAvatar = () => {
    deleteAvatar.mutate(undefined, {
      onSuccess: () => {
        setShowAvatarDialog(false)
        setPreviewUrl(null)
      },
    })
  }

  const hasChanges = 
    username !== user?.username ||
    bio !== (user?.bio || '') ||
    university !== (user?.university || '')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Update your profile photo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 cursor-pointer" onClick={handleAvatarClick}>
                {user?.avatar_url ? (
                  <AvatarImage src={user.avatar_url} alt={user.username} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl">
                    {user ? getInitials(user.username) : 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <button
                onClick={handleAvatarClick}
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-8 w-8 text-white" />
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Profile Photo</p>
              <p className="text-sm text-muted-foreground">
                JPG, PNG, or GIF. Max 5MB.
              </p>
              <Button variant="outline" size="sm" onClick={handleAvatarClick}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
              {user?.avatar_url && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={handleRemoveAvatar}
                  disabled={deleteAvatar.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="bio" className="text-sm font-medium">
              Bio
            </label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={3}
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/160
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="university" className="text-sm font-medium">
              University
            </label>
            <Input
              id="university"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="Your university name"
            />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={updateProfile.isPending || !hasChanges}
          >
            {updateProfile.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look of the app</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Dark mode is currently enabled by default. Additional theme options coming soon.
          </p>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">Delete Account</Button>
        </CardContent>
      </Card>

      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <Avatar className="h-32 w-32">
                {previewUrl ? (
                  <AvatarImage src={previewUrl} alt="Preview" />
                ) : user?.avatar_url ? (
                  <AvatarImage src={user.avatar_url} alt={user.username} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-3xl">
                    {user ? getInitials(user.username) : 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                onClick={handleUploadAvatar}
                disabled={!previewUrl || uploadAvatar.isPending}
              >
                {uploadAvatar.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
              {user?.avatar_url && (
                <Button 
                  variant="destructive" 
                  onClick={handleRemoveAvatar}
                  disabled={deleteAvatar.isPending}
                >
                  {deleteAvatar.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
