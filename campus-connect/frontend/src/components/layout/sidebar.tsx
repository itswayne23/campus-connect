import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Home, MessageCircle, Settings, UserPlus, TrendingUp, Bookmark, BarChart3, Activity, Download, FolderOpen, Hash } from 'lucide-react'
import type { User } from '@/types'

const sidebarItems = [
  { path: '/', icon: Home, label: 'Home Feed' },
  { path: '/explore', icon: TrendingUp, label: 'Explore' },
  { path: '/hashtags', icon: Hash, label: 'Hashtags' },
  { path: '/anonymous', icon: MessageCircle, label: 'Anonymous' },
  { path: '/bookmarks', icon: Bookmark, label: 'Saved' },
  { path: '/collections', icon: FolderOpen, label: 'Collections' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/activity', icon: Activity, label: 'Activity' },
  { path: '/export', icon: Download, label: 'Export Data' },
]

export function Sidebar() {
  const location = useLocation()
  const { user } = useAuthStore()

  const { data: suggestedUsers } = useQuery({
    queryKey: ['suggested-users'],
    queryFn: async () => {
      const response = await api.get<User[]>('/users/search?q=')
      return response.data.filter((u: User) => u.id !== user?.id).slice(0, 5)
    },
  })

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <aside className="hidden lg:flex flex-col w-72 h-[calc(100vh-4rem)] sticky top-16 p-4 space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-gray-600 dark:text-gray-400">Menu</h3>
        <div className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = item.path === '/' 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path)
            
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`w-full justify-start gap-3 h-11 ${isActive ? 'bg-blue-50 dark:bg-blue-950 text-blue-600' : ''}`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-base">{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-600 dark:text-gray-400">Suggested for you</h3>
          <Button variant="link" size="sm" className="text-blue-500 h-auto p-0">
            See all
          </Button>
        </div>
        <div className="space-y-3">
          {suggestedUsers?.map((suggestedUser) => (
            <div key={suggestedUser.id} className="flex items-center justify-between">
              <Link to={`/profile/${suggestedUser.id}`} className="flex items-center gap-2 flex-1 min-w-0">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={suggestedUser.avatar_url || undefined} alt={suggestedUser.username} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                    {getInitials(suggestedUser.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{suggestedUser.username}</p>
                  {suggestedUser.bio && <p className="text-xs text-gray-500 truncate">{suggestedUser.bio}</p>}
                </div>
              </Link>
              <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600">
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {!suggestedUsers?.length && (
            <p className="text-sm text-gray-500 text-center py-2">No suggestions available</p>
          )}
        </div>
      </Card>

      <div className="pt-2">
        <Link to="/settings">
          <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-gray-600 dark:text-gray-400">
            <Settings className="h-5 w-5" />
            <span className="text-base">Settings</span>
          </Button>
        </Link>
      </div>

      <div className="text-xs text-gray-400 pt-4">
        <p>Campus Connect © 2024</p>
        <p className="mt-1">Made with ❤️ for students</p>
      </div>
    </aside>
  )
}
