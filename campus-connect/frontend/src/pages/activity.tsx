import { useActivityLog, useActivityStats, useClearActivity } from '@/hooks/use-activity-export'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Activity, Trash2, FileText, Heart, MessageCircle, UserPlus, Settings } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

const actionIcons: Record<string, React.ReactNode> = {
  post_created: <FileText className="h-4 w-4" />,
  post_liked: <Heart className="h-4 w-4" />,
  post_commented: <MessageCircle className="h-4 w-4" />,
  follow: <UserPlus className="h-4 w-4" />,
  profile_updated: <Settings className="h-4 w-4" />,
  login: <Activity className="h-4 w-4" />,
}

const actionLabels: Record<string, string> = {
  post_created: 'Created a post',
  post_deleted: 'Deleted a post',
  post_liked: 'Liked a post',
  post_commented: 'Commented on a post',
  follow: 'Followed someone',
  unfollow: 'Unfollowed someone',
  profile_updated: 'Updated profile',
  login: 'Logged in',
  logout: 'Logged out',
  settings_changed: 'Changed settings',
}

export function ActivityPage() {
  const { data: activityData, isLoading } = useActivityLog()
  const { data: stats } = useActivityStats()
  const clearActivity = useClearActivity()

  const handleClear = () => {
    if (confirm('Are you sure you want to delete activity older than 90 days?')) {
      clearActivity.mutate(undefined, {
        onSuccess: () => {
          toast.success('Old activity cleared')
        },
        onError: () => {
          toast.error('Failed to clear activity')
        },
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6" />
          Activity Log
        </h1>
        <Button variant="outline" size="sm" onClick={handleClear} disabled={clearActivity.isPending}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Old
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(stats.stats).map(([key, value]) => (
            <Card key={key} className="p-3">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{actionLabels[key] || key}</p>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {!activityData?.activities.length ? (
            <p className="text-center text-muted-foreground py-8">No activity recorded yet</p>
          ) : (
            <div className="space-y-3">
              {activityData.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="p-2 rounded-full bg-primary/10">
                    {actionIcons[activity.action_type] || <Activity className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{actionLabels[activity.action_type] || activity.action_type}</p>
                    {activity.entity_type && (
                      <p className="text-sm text-muted-foreground">
                        {activity.entity_type}: {activity.entity_id?.slice(0, 8)}...
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
