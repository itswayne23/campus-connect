import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'
import { useUIStore } from '@/store/ui-store'
import { useLogout } from '@/hooks/use-auth'
import { useNotifications } from '@/hooks/use-notifications'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Home, MessageCircle, Bell, User, Settings, LogOut, Search, Shield, X, Moon, Sun } from 'lucide-react'
import type { User as UserType } from '@/types'

export function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { theme, setTheme } = useUIStore()
  const logout = useLogout()
  const { data: notifications } = useNotifications()
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [theme])

  const unreadCount = notifications?.unread_count || 0

  const { data: searchResults } = useQuery({
    queryKey: ['navbar-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) return []
      const response = await api.get<UserType[]>(`/users/search?q=${encodeURIComponent(searchQuery)}`)
      return response.data.slice(0, 5)
    },
    enabled: searchQuery.length >= 2,
  })

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
              Campus Connect
            </span>
          </Link>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search Campus Connect..."
              className="w-full pl-10 bg-gray-100 dark:bg-gray-800 border-0 rounded-full focus-visible:ring-2 focus-visible:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
            {searchResults && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                {searchResults.map((result) => (
                  <Link
                    key={result.id}
                    to={`/profile/${result.id}`}
                    onClick={() => {
                      setSearchQuery('')
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={result.avatar_url || undefined} alt={result.username} />
                      <AvatarFallback>{getInitials(result.username)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{result.username}</p>
                      {result.bio && <p className="text-xs text-gray-500 line-clamp-1">{result.bio}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </form>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/">
            <Button
              variant={location.pathname === '/' ? 'secondary' : 'ghost'}
              size="icon"
              className={`rounded-full ${location.pathname === '/' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}`}
            >
              <Home className="h-5 w-5" />
            </Button>
          </Link>

          <Link to="/messages">
            <Button
              variant={location.pathname.startsWith('/messages') ? 'secondary' : 'ghost'}
              size="icon"
              className={`rounded-full ${location.pathname.startsWith('/messages') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}`}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </Link>

          <Link to="/notifications">
            <Button
              variant={location.pathname === '/notifications' ? 'secondary' : 'ghost'}
              size="icon"
              className={`relative rounded-full ${location.pathname === '/notifications' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </Link>

          <Link to="/anonymous">
            <Button
              variant={location.pathname === '/anonymous' ? 'secondary' : 'ghost'}
              size="icon"
              className={`rounded-full ${location.pathname === '/anonymous' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}`}
            >
              <span className="text-lg">📝</span>
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-blue-500 transition-all">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar_url || undefined} alt={user?.username} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {user ? getInitials(user.username) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user?.avatar_url || undefined} alt={user?.username} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {user ? getInitials(user.username) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user?.username}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to={`/profile/${user?.id}`} className="flex items-center">
                  <User className="mr-3 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/settings" className="flex items-center">
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout.mutate()} className="cursor-pointer text-red-600">
                <LogOut className="mr-3 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
