import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUserGamificationStats, useLeaderboard, useUserAchievements, useAllAchievements } from '@/hooks/use-gamification'
import { Trophy, Medal, Star, Flame, Award, Crown, Target, Zap, TrendingUp } from 'lucide-react'

export function GamificationPage() {
  const { data: stats, isLoading } = useUserGamificationStats()
  const { data: leaderboard } = useLeaderboard()
  const { data: userAchievements } = useUserAchievements()
  const { data: allAchievements } = useAllAchievements()

  const [activeTab, setActiveTab] = useState<'stats' | 'leaderboard' | 'achievements'>('stats')

  const levelColors = ['gray', 'green', 'blue', 'purple', 'orange', 'red', 'gold']
  const levelLabels = ['Newcomer', 'Regular', 'Active', 'Contributor', 'Veteran', 'Elite', 'Legend']

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-4">
        <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Gamification
        </h1>

        <div className="flex gap-2 border-b mb-4">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'stats' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500'}`}
          >
            My Stats
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'leaderboard' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500'}`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'achievements' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500'}`}
          >
            Achievements
          </button>
        </div>

        {activeTab === 'stats' && stats && (
          <div className="space-y-4">
            <Card className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30">
              <div className="flex items-center gap-4">
                <div className={`h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white bg-${levelColors[stats.level - 1]}-500`}>
                  {stats.level}
                </div>
                <div>
                  <div className="text-sm text-gray-500">Level {stats.level}</div>
                  <div className="text-3xl font-bold">{levelLabels[stats.level - 1]}</div>
                  <div className="text-sm text-gray-500">{stats.total_points} points</div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 text-center">
                <Flame className="h-8 w-8 mx-auto text-orange-500" />
                <div className="text-2xl font-bold mt-2">{stats.current_streak}</div>
                <div className="text-sm text-gray-500">Day Streak</div>
              </Card>
              <Card className="p-4 text-center">
                <Crown className="h-8 w-8 mx-auto text-yellow-500" />
                <div className="text-2xl font-bold mt-2">#{stats.rank}</div>
                <div className="text-sm text-gray-500">Rank</div>
              </Card>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <Card className="p-3 text-center">
                <Target className="h-6 w-6 mx-auto text-blue-500" />
                <div className="font-bold">{stats.posts_count}</div>
                <div className="text-xs text-gray-500">Posts</div>
              </Card>
              <Card className="p-3 text-center">
                <Zap className="h-6 w-6 mx-auto text-yellow-500" />
                <div className="font-bold">{stats.likes_received}</div>
                <div className="text-xs text-gray-500">Likes</div>
              </Card>
              <Card className="p-3 text-center">
                <MessageCircle className="h-6 w-6 mx-auto text-green-500" />
                <div className="font-bold">{stats.comments_count}</div>
                <div className="text-xs text-gray-500">Comments</div>
              </Card>
              <Card className="p-3 text-center">
                <Users className="h-6 w-6 mx-auto text-purple-500" />
                <div className="font-bold">{stats.followers_count}</div>
                <div className="text-xs text-gray-500">Followers</div>
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Award className="h-5 w-5" />
                Recent Achievements
              </h3>
              <div className="space-y-2">
                {userAchievements?.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      {a.achievement.icon || '🏆'}
                    </div>
                    <div>
                      <div className="font-medium">{a.achievement.name}</div>
                      <div className="text-xs text-gray-500">{a.achievement.description}</div>
                    </div>
                  </div>
                ))}
                {(!userAchievements || userAchievements.length === 0) && (
                  <p className="text-sm text-gray-500">No achievements yet. Keep engaging!</p>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'leaderboard' && leaderboard && (
          <div className="space-y-2">
            {leaderboard.entries.map((entry) => (
              <Card key={entry.user_id} className={`p-4 ${entry.rank <= 3 ? 'bg-yellow-50 dark:bg-yellow-950/30' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-bold w-8 ${entry.rank === 1 ? 'text-yellow-500' : entry.rank === 2 ? 'text-gray-400' : entry.rank === 3 ? 'text-orange-400' : ''}`}>
                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{entry.username}</div>
                    <div className="text-sm text-gray-500">{entry.total_points} points</div>
                  </div>
                  {entry.current_streak > 0 && (
                    <div className="flex items-center gap-1 text-orange-500">
                      <Flame className="h-4 w-4" />
                      {entry.current_streak}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="grid grid-cols-2 gap-3">
            {allAchievements?.map((achievement) => {
              const earned = userAchievements?.some((ua) => ua.achievement_id === achievement.id)
              return (
                <Card key={achievement.id} className={`p-4 ${earned ? 'bg-yellow-50 dark:bg-yellow-950/30' : 'opacity-60'}`}>
                  <div className="text-3xl mb-2">{achievement.icon || '🏆'}</div>
                  <div className="font-medium">{achievement.name}</div>
                  <div className="text-sm text-gray-500">{achievement.description}</div>
                  <div className="mt-2 text-xs text-gray-400">{achievement.points_required} points required</div>
                  {earned && <div className="mt-2 text-xs text-green-600 font-medium">Earned!</div>}
                </Card>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function MessageCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function Users({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
