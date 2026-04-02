import { Link } from 'react-router-dom'
import { useNotifications, useMarkAllNotificationsRead } from '@/hooks/use-notifications'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Heart, MessageCircle, UserPlus, Bell, Mail } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const notificationIcons: Record<string, any> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  message: Mail,
  mention: Bell,
}

export function NotificationsPage() {
  const { data, isLoading } = useNotifications()
  const markAllRead = useMarkAllNotificationsRead()

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {data && data.unread_count > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            Mark all as read
          </Button>
        )}
      </div>

      {data?.notifications && data.notifications.length > 0 ? (
        <div className="space-y-2">
          {data.notifications.map((notification) => {
            const Icon = notificationIcons[notification.type] || Bell
            
            return (
              <Link
                key={notification.id}
                to={notification.post_id ? `/post/${notification.post_id}` : `/profile/${notification.actor_id}`}
              >
                <Card
                  className={`p-4 hover:bg-accent transition-colors ${
                    !notification.is_read ? 'bg-primary/5 border-primary/20' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    {notification.actor ? (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={notification.actor.avatar_url || undefined} />
                        <AvatarFallback>{notification.actor.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                    )}

                    <div className="flex-1">
                      <p>
                        <span className="font-semibold">{notification.actor?.username || 'Someone'}</span>
                        {' '}
                        {notification.type === 'like' && 'liked your post'}
                        {notification.type === 'comment' && 'commented on your post'}
                        {notification.type === 'follow' && 'started following you'}
                        {notification.type === 'message' && 'sent you a message'}
                        {notification.type === 'mention' && 'mentioned you in a post'}
                      </p>
                      {notification.post && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {notification.post.content}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>

                    {!notification.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary self-center" />
                    )}
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">No notifications yet</p>
        </Card>
      )}
    </div>
  )
}
