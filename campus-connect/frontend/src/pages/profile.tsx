import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useUser, useFollowUser, useUnfollowUser, useBlockUser, useReportUser, useMuteUser, useUnmuteUser } from '@/hooks/use-users'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PostCard } from '@/components/feed/post-card'
import { Loader2, Calendar, MapPin, UserPlus, UserMinus, MessageCircle, Share2, MoreHorizontal, AlertTriangle, Ban, BellOff } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Post } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { VerifiedBadge } from '@/components/verified-badge'
import { ProfileBadges } from '@/components/badges-display'

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { data: user, isLoading } = useUser(userId!)
  const followUser = useFollowUser()
  const unfollowUser = useUnfollowUser()
  const blockUser = useBlockUser()
  const muteUser = useMuteUser()
  const unmuteUser = useUnmuteUser()
  const reportUser = useReportUser()
  
  const [activeTab, setActiveTab] = useState<'posts' | 'media'>('posts')
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const { data: posts } = useQuery({
    queryKey: ['userPosts', userId],
    queryFn: async () => {
      const response = await api.get<Post[]>(`/users/${userId}/posts`)
      return response.data
    },
    enabled: !!userId,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found</p>
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase()
  }

  const handleMessage = () => {
    navigate(`/messages/${user.id}`)
  }

  const handleShare = async () => {
    const shareData = {
      title: `${user.username}'s Profile`,
      text: `Check out ${user.username}'s profile on Campus Connect`,
      url: window.location.origin + `/profile/${user.id}`
    }
    
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareData.url)
      toast.success('Link copied to clipboard!')
    }
  }

  const handleBlock = () => {
    blockUser.mutate(user.id)
    setShowMoreMenu(false)
  }

  const handleMute = () => {
    if (user.is_muted) {
      unmuteUser.mutate(user.id)
    } else {
      muteUser.mutate(user.id)
    }
    setShowMoreMenu(false)
  }

  const handleReport = () => {
    if (!reportReason.trim()) {
      toast.error('Please provide a reason')
      return
    }
    reportUser.mutate({ userId: user.id, reason: reportReason })
    setShowReportDialog(false)
    setReportReason('')
  }

  const mediaPosts = posts?.filter(post => post.media_urls && post.media_urls.length > 0) || []
  const displayPosts = activeTab === 'media' ? mediaPosts : posts || []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
        
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
            <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
              <AvatarImage src={user.avatar_url || undefined} alt={user.username} />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-purple-600 text-white">
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  {user.username}
                  {user.is_verified && <VerifiedBadge size="md" />}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-muted-foreground text-sm">{user.email}</p>
                  {user.is_own_profile && <ProfileBadges userId={user.id} />}
                </div>
              </div>

              {!user.is_own_profile && (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMessage}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  {user.is_following ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unfollowUser.mutate(user.id)}
                      disabled={unfollowUser.isPending}
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Following
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => followUser.mutate(user.id)}
                      disabled={followUser.isPending}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Follow
                    </Button>
                  )}
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    {showMoreMenu && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-background border rounded-lg shadow-lg z-10 py-1">
                        <Button
                          variant="ghost"
                          className="w-full justify-start px-4 py-2 text-sm"
                          onClick={handleShare}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Profile
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start px-4 py-2 text-sm text-yellow-600"
                          onClick={handleMute}
                        >
                          <BellOff className="h-4 w-4 mr-2" />
                          {user.is_muted ? 'Unmute User' : 'Mute User'}
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start px-4 py-2 text-sm text-orange-600"
                          onClick={handleBlock}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Block User
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start px-4 py-2 text-sm text-red-600"
                          onClick={() => setShowReportDialog(true)}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Report User
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {user.is_own_profile && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/settings">Edit Profile</Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {user.bio && (
            <p className="mt-4 text-sm">{user.bio}</p>
          )}

          <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
            {user.university && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {user.university}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Joined {formatDate(user.created_at)}
            </div>
          </div>

          <div className="flex gap-6 mt-4 pt-4 border-t cursor-pointer">
            <div className="text-center">
              <p className="text-xl font-bold">{user.posts_count}</p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </div>
            <Link to={`/profile/${userId}/followers`} className="text-center hover:opacity-80">
              <p className="text-xl font-bold">{user.followers_count}</p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </Link>
            <Link to={`/profile/${userId}/following`} className="text-center hover:opacity-80">
              <p className="text-xl font-bold">{user.following_count}</p>
              <p className="text-sm text-muted-foreground">Following</p>
            </Link>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'posts' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'media' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('media')}
          >
            Media
          </button>
        </div>
      </Card>

      <div className="space-y-4">
        {!displayPosts || displayPosts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {activeTab === 'media' ? 'No media posts yet' : 'No posts yet'}
            </p>
          </Card>
        ) : (
          displayPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
            <DialogDescription>
              Please provide a reason for reporting {user.username}. We will review your report.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Reason for reporting..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReport}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
