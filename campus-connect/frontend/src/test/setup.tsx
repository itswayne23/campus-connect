import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock React Router with proper context
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => {
      const navigate = vi.fn()
      return navigate
    },
    useLocation: () => ({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    }),
    useParams: () => ({}),
    useSearchParams: () => {
      const params = new URLSearchParams()
      return [
        params,
        {
          get: (key: string) => params.get(key),
          set: (key: string, value: string) => params.set(key, value),
          delete: (key: string) => params.delete(key),
        },
      ] as const
    },
    Link: ({ children, to, ...props }: any) => (
      <a href={to} {...props}>{children}</a>
    ),
    BrowserRouter: ({ children }: any) => children,
    MemoryRouter: ({ children }: any) => children,
    Router: ({ children }: any) => children,
  }
})

// Mock Zustand stores
vi.mock('@/store/auth-store', () => ({
  useAuthStore: vi.fn((selector?: (state: any) => any) => {
    const state = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        avatar_url: null,
        bio: null,
        university: null,
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
        is_following: false,
        created_at: new Date().toISOString(),
      },
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh-token',
      isAuthenticated: true,
      setAuth: vi.fn(),
      setTokens: vi.fn(),
      setUser: vi.fn(),
      logout: vi.fn(),
    }
    return selector ? selector(state) : state
  }),
}))

vi.mock('@/store/ui-store', () => ({
  useUIStore: vi.fn((selector?: (state: any) => any) => {
    const state = {
      theme: 'dark' as 'light' | 'dark' | 'system',
      setTheme: vi.fn(),
    }
    return selector ? selector(state) : state
  }),
}))

// Mock React Query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })),
    useMutation: vi.fn(() => ({
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
      isError: false,
      error: null,
    })),
    useQueryClient: vi.fn(() => ({
      invalidateQueries: vi.fn(),
      setQueriesData: vi.fn(),
      clear: vi.fn(),
      getQueryData: vi.fn(),
      setQueryData: vi.fn(),
    })),
    QueryClient: vi.fn(() => ({
      invalidateQueries: vi.fn(),
      clear: vi.fn(),
    })),
    QueryClientProvider: ({ children }: any) => children,
  }
})

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  Toaster: () => null,
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
})

// Mock Web Share API
Object.assign(navigator, {
  share: vi.fn().mockResolvedValue(undefined),
})

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
window.ResizeObserver = ResizeObserverMock

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn()
}
(window as any).IntersectionObserver = IntersectionObserverMock

// Global fetch mock
global.fetch = vi.fn()

// Global test utilities
global.render = async (component: any) => {
  return {
    container: document.createElement('div'),
    unmount: vi.fn(),
  }
}
