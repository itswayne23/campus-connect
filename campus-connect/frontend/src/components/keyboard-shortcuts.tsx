import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKeyboardShortcuts } from '@/hooks/use-infinite-scroll'
import { useAuthStore } from '@/store/auth-store'

interface ShortcutConfig {
  key: string
  description: string
  action: () => void
}

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [showHelp, setShowHelp] = useState(false)

  const shortcuts: Record<string, () => void> = {
    'g h': () => navigate('/'),
    'g e': () => navigate('/explore'),
    'g n': () => navigate('/notifications'),
    'g m': () => navigate('/messages'),
    'g p': () => {
      const userId = useAuthStore.getState().user?.id
      if (userId) navigate(`/profile/${userId}`)
    },
    'g s': () => navigate('/settings'),
    'g b': () => navigate('/bookmarks'),
    '?': () => setShowHelp((prev) => !prev),
    'n': () => {
      const event = new CustomEvent('open-composer')
      window.dispatchEvent(event)
    },
    'escape': () => setShowHelp(false),
  }

  useKeyboardShortcuts(shortcuts)

  useEffect(() => {
    const handleShowHelp = () => setShowHelp(true)
    window.addEventListener('show-shortcuts-help', handleShowHelp)
    return () => window.removeEventListener('show-shortcuts-help', handleShowHelp)
  }, [])

  return (
    <>
      {children}
      {showHelp && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-background border rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Keyboard Shortcuts</h2>
            <div className="space-y-2">
              <ShortcutRow keyCombo="g then h" description="Go to Home" />
              <ShortcutRow keyCombo="g then e" description="Go to Explore" />
              <ShortcutRow keyCombo="g then n" description="Go to Notifications" />
              <ShortcutRow keyCombo="g then m" description="Go to Messages" />
              <ShortcutRow keyCombo="g then p" description="Go to Profile" />
              <ShortcutRow keyCombo="g then s" description="Go to Settings" />
              <ShortcutRow keyCombo="g then b" description="Go to Bookmarks" />
              <ShortcutRow keyCombo="n" description="Open composer" />
              <ShortcutRow keyCombo="?" description="Show shortcuts" />
              <ShortcutRow keyCombo="Esc" description="Close dialog" />
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-4 w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function ShortcutRow({ keyCombo, description }: { keyCombo: string; description: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-muted-foreground">{description}</span>
      <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">{keyCombo}</kbd>
    </div>
  )
}

export function KeyboardShortcutsHint() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('show-shortcuts-help'))}
      className="fixed bottom-20 right-4 px-3 py-1.5 bg-muted rounded-full text-xs text-muted-foreground hover:bg-muted/80 transition-opacity"
    >
      Press ? for shortcuts
    </button>
  )
}
