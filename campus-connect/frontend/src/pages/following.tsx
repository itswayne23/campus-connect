import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, ArrowLeft, UserPlus, UserMinus } from 'lucide-react'
import { useFollowUser, useUnfollowUser, useUser } from '@/hooks/use-users'
import type { User } from '@/types'

export function FollowingPage() {
  const { userId } = useParams<{ userId: string }>()
  const { data: currentUser } = useUser(userId!)
  const { data: following, isLoading } = useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      const response = await api.get<User[]>(`/users/${userId}/following`)
      return response.data
    },
    enabled: !!userId,
  })

  const followUser = useFollowUser()
  const unfollowUser = useUnfollowUser()

  const getInitials = (name: string) => name.slice(0, 2).toUpperCase()

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/profile/${userId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">{currentUser?.username}'s Following</h1>
          <p className="text-sm text-muted-foreground">{following?.length || 0} following</p>
        </div>
      </div>

      <Card>
        {following && following.length > 0 ? (
          <div className="divide-y">
            {following.map((user) => (
              <div key={user.id} className="p-4 flex items-center justify-between">
                <Link to={`/profile/${user.id}`} className="flex items-center gap-3 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.username} />
                    <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{user.username}</p>
                    {user.bio && <p className="text-sm text-muted-foreground line-clamp-1">{user.bio}</p>}
                  </div>
                </Link>
                {user.is_following !== undefined && !user.is_own_profile && (
                  user.is_following ? (
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
                  )
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <p>Not following anyone yet</p>
          </div>
        )}
      </Card>
    </div>
  )
}
