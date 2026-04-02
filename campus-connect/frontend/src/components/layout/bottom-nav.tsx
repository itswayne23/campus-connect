import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'
import { Home, Compass, MessageCircle, User } from 'lucide-react'

export function BottomNav() {
  const location = useLocation()
  const { user } = useAuthStore()

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/explore', icon: Compass, label: 'Explore' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: `/profile/${user?.id}`, icon: User, label: 'Profile' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item, index) => {
          const isActive = item.path === '/' 
            ? location.pathname === item.path 
            : location.pathname.startsWith(item.path)

          if (index === 2) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-16 h-12 rounded-lg transition-colors ${
                  isActive 
                    ? 'text-blue-500' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-16 h-12 rounded-lg transition-colors ${
                isActive 
                  ? 'text-blue-500' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
