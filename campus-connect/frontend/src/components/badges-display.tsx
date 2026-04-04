import { useMyBadges } from '@/hooks/use-badges'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export function BadgesDisplay() {
  const { data: badgesData, isLoading } = useMyBadges()

  if (isLoading) {
    return <Loader2 className="h-6 w-6 animate-spin" />
  }

  if (!badgesData || badgesData.badges.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No badges yet. Keep engaging to earn badges!
      </div>
    )
  }

  const earnedBadges = badgesData.badges.filter(b => b.earned_at)
  const lockedBadges = badgesData.badges.filter(b => !b.earned_at)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Badges</h3>
        <span className="text-sm text-muted-foreground">
          {earnedBadges.length} / {badgesData.badges.length} earned
        </span>
      </div>

      {earnedBadges.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {earnedBadges.map((badge) => (
            <div
              key={badge.id}
              className="flex flex-col items-center p-2 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30"
              title={`${badge.name}: ${badge.description}`}
            >
              <span className="text-2xl">{badge.icon}</span>
              <span className="text-xs mt-1 text-center">{badge.name}</span>
            </div>
          ))}
        </div>
      )}

      {lockedBadges.length > 0 && (
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">Locked</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {lockedBadges.map((badge) => (
              <div
                key={badge.id}
                className="flex flex-col items-center p-2 rounded-lg bg-muted opacity-50"
                title={`${badge.name}: ${badge.description}`}
              >
                <span className="text-2xl grayscale">🔒</span>
                <span className="text-xs mt-1 text-center">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function ProfileBadges({ userId }: { userId: string }) {
  const { data: badgesData, isLoading } = useMyBadges()

  if (isLoading) {
    return null
  }

  if (!badgesData || badgesData.total_badges === 0) {
    return null
  }

  const earnedBadges = badgesData.badges.filter(b => b.earned_at).slice(0, 5)

  if (earnedBadges.length === 0) {
    return null
  }

  return (
    <div className="flex gap-1">
      {earnedBadges.map((badge) => (
        <span
          key={badge.id}
          className="text-lg cursor-pointer"
          title={`${badge.name}: ${badge.description}`}
        >
          {badge.icon}
        </span>
      ))}
    </div>
  )
}
