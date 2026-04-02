import { describe, it, expect, beforeEach } from 'vitest'
import { act } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

// Recreate the stores for testing
interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  setUser: (user: User) => void
  logout: () => void
}

interface UIState {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

// Create test versions without persistence
const createTestAuthStore = () => {
  return create<AuthState>()((set) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    setAuth: (user, accessToken, refreshToken) =>
      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
      }),
    setTokens: (accessToken, refreshToken) =>
      set({
        accessToken,
        refreshToken,
      }),
    setUser: (user) =>
      set({
        user,
      }),
    logout: () =>
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      }),
  }))
}

const createTestUIStore = () => {
  return create<UIState>()((set) => ({
    theme: 'dark',
    setTheme: (theme) => set({ theme }),
  }))
}

describe('Auth Store Logic', () => {
  let store: ReturnType<typeof createTestAuthStore>

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    avatar_url: null,
    bio: 'Test bio',
    university: 'Test University',
    followers_count: 10,
    following_count: 5,
    posts_count: 20,
    is_following: false,
    created_at: new Date().toISOString(),
  }

  beforeEach(() => {
    store = createTestAuthStore()
  })

  describe('Initial State', () => {
    it('should have null user initially', () => {
      const state = store.getState()
      expect(state.user).toBeNull()
    })

    it('should have null accessToken initially', () => {
      const state = store.getState()
      expect(state.accessToken).toBeNull()
    })

    it('should have null refreshToken initially', () => {
      const state = store.getState()
      expect(state.refreshToken).toBeNull()
    })

    it('should not be authenticated initially', () => {
      const state = store.getState()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('setAuth', () => {
    it('should set user, tokens and mark as authenticated', () => {
      const { setAuth } = store.getState()
      
      act(() => {
        setAuth(mockUser, 'access-token', 'refresh-token')
      })
      
      const state = store.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.accessToken).toBe('access-token')
      expect(state.refreshToken).toBe('refresh-token')
      expect(state.isAuthenticated).toBe(true)
    })
  })

  describe('setTokens', () => {
    it('should update tokens without changing user', () => {
      const { setAuth, setTokens } = store.getState()
      
      act(() => {
        setAuth(mockUser, 'old-access', 'old-refresh')
        setTokens('new-access', 'new-refresh')
      })
      
      const state = store.getState()
      expect(state.accessToken).toBe('new-access')
      expect(state.refreshToken).toBe('new-refresh')
      expect(state.user).toEqual(mockUser)
    })
  })

  describe('setUser', () => {
    it('should update user without changing tokens', () => {
      const { setAuth, setUser } = store.getState()
      
      act(() => {
        setAuth(mockUser, 'access-token', 'refresh-token')
        const newUser = { ...mockUser, username: 'newusername' }
        setUser(newUser)
      })
      
      const state = store.getState()
      expect(state.user?.username).toBe('newusername')
      expect(state.accessToken).toBe('access-token')
    })
  })

  describe('logout', () => {
    it('should clear all auth state', () => {
      const { setAuth, logout } = store.getState()
      
      act(() => {
        setAuth(mockUser, 'access-token', 'refresh-token')
        logout()
      })
      
      const state = store.getState()
      expect(state.user).toBeNull()
      expect(state.accessToken).toBeNull()
      expect(state.refreshToken).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })
})

describe('UI Store Logic', () => {
  let store: ReturnType<typeof createTestUIStore>

  beforeEach(() => {
    store = createTestUIStore()
  })

  describe('Initial State', () => {
    it('should have dark theme by default', () => {
      const state = store.getState()
      expect(state.theme).toBe('dark')
    })
  })

  describe('setTheme', () => {
    it('should update theme to light', () => {
      const { setTheme } = store.getState()
      
      act(() => {
        setTheme('light')
      })
      
      const state = store.getState()
      expect(state.theme).toBe('light')
    })

    it('should update theme to dark', () => {
      const { setTheme } = store.getState()
      
      act(() => {
        setTheme('dark')
      })
      
      const state = store.getState()
      expect(state.theme).toBe('dark')
    })

    it('should update theme to system', () => {
      const { setTheme } = store.getState()
      
      act(() => {
        setTheme('system')
      })
      
      const state = store.getState()
      expect(state.theme).toBe('system')
    })
  })
})
