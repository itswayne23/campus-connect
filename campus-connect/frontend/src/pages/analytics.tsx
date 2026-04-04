import { useAnalyticsDashboard } from '@/hooks/use-analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, TrendingUp, TrendingDown, Eye, Heart, MessageCircle, Users, UserPlus, BarChart3 } from 'lucide-react'

export function AnalyticsPage() {
  const { data: analytics, isLoading } = useAnalyticsDashboard(30)

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Unable to load analytics</p>
      </div>
    )
  }

  const { summary, follower_growth, post_analytics } = analytics

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Analytics Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Posts"
          value={summary.total_posts}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <StatCard
          title="Followers"
          value={summary.total_followers}
          icon={<Users className="h-5 w-5" />}
          trend={follower_growth.growth_percentage}
        />
        <StatCard
          title="Following"
          value={summary.total_following}
          icon={<UserPlus className="h-5 w-5" />}
        />
        <StatCard
          title="Engagement Rate"
          value={`${summary.avg_engagement_rate.toFixed(1)}%`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Likes Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-red-500" />
              <span className="text-2xl font-bold">{summary.total_likes_received}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Comments Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-blue-500" />
              <span className="text-2xl font-bold">{summary.total_comments_received}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Eye className="h-6 w-6 text-purple-500" />
              <span className="text-2xl font-bold">{post_analytics.total_views}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Follower Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">Current followers</span>
            <span className="font-bold">{follower_growth.current_followers}</span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-muted-foreground">Growth</span>
            {follower_growth.growth_percentage >= 0 ? (
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <TrendingUp className="h-4 w-4" />
                +{follower_growth.growth_percentage}%
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <TrendingDown className="h-4 w-4" />
                {follower_growth.growth_percentage}%
              </span>
            )}
          </div>
          {follower_growth.stats.length > 0 && (
            <div className="h-32 flex items-end gap-1">
              {follower_growth.stats.slice(-14).map((stat, i) => (
                <div
                  key={i}
                  className="flex-1 bg-primary rounded-t"
                  style={{
                    height: `${Math.max(
                      10,
                      (stat.follower_count / Math.max(...follower_growth.stats.map(s => s.follower_count), 1)) * 100
                    )}%`
                  }}
                  title={`${stat.date}: ${stat.follower_count} followers`}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Top Performing Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {post_analytics.insights.length > 0 ? (
            <div className="space-y-3">
              {post_analytics.insights.slice(0, 5).map((insight) => (
                <div
                  key={insight.post_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">{insight.likes_count}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">{insight.comments_count}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Eye className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">{insight.views}</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {insight.post_id.slice(0, 8)}...
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No post analytics yet. Keep posting!
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{summary.total_posts}</p>
              <p className="text-sm text-muted-foreground">Total Posts</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{post_analytics.avg_likes_per_post.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Avg Likes/Post</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{summary.total_followers}</p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{summary.avg_engagement_rate.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Engagement</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  trend
}: {
  title: string
  value: number | string
  icon: React.ReactNode
  trend?: number
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground">{icon}</div>
          {trend !== undefined && trend >= 0 && (
            <span className="text-xs text-green-600 font-medium flex items-center">
              <TrendingUp className="h-3 w-3" />
              +{trend}%
            </span>
          )}
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  )
}
