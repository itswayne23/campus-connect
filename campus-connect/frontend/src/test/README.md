# Testing Guide for Campus Connect Frontend

## Overview

This project uses **Vitest** as the test runner with **React Testing Library** for component testing. The testing setup is configured in `vitest.config.ts`.

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests with UI
```bash
npm run test:ui
```

## Test Structure

```
src/test/
├── lib/
│   └── utils.test.ts           # Tests for utility functions
├── store/
│   └── stores.test.ts          # Tests for Zustand stores
├── components/
│   ├── ui.test.tsx            # Tests for UI components
│   └── feed.test.tsx           # Tests for feed components
├── hooks/
│   └── hooks.test.tsx         # Tests for custom hooks
└── pages/
    ├── auth.test.tsx           # Tests for auth pages
    ├── content.test.tsx        # Tests for content pages
    ├── user-pages.test.tsx     # Tests for user pages
    └── app.test.tsx            # Tests for App component
```

## Writing Tests

### Utility Functions
```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from '@/lib/utils'

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction(input)).toBe(expected)
  })
})
```

### Components
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('should render', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### Mocking

The test setup file (`setup.ts`) includes mocks for:
- React Router DOM
- Zustand stores
- React Query
- Sonner toasts
- Browser APIs (matchMedia, clipboard, share)

### Custom Mocks

For component-specific mocks, use `vi.mock()`:

```typescript
vi.mock('@/hooks/use-auth', () => ({
  useLogin: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}))
```

## Best Practices

1. **Test behavior, not implementation** - Focus on what the component does, not how it does it
2. **Use semantic queries** - Prefer `getByRole`, `getByLabelText`, `getByText` over test IDs
3. **Keep tests independent** - Each test should be able to run in isolation
4. **Mock external dependencies** - API calls, stores, and third-party libraries should be mocked
5. **Use descriptive test names** - Test names should clearly describe what they test

## Coverage

Coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`. You can view the HTML report by opening `coverage/index.html` in a browser.

## Troubleshooting

### Tests failing due to environment issues
- Make sure jsdom is properly configured in `vitest.config.ts`
- Check that all required mocks are in place

### Async tests failing
- Use `waitFor` from React Testing Library for async operations
- Make sure to await promises properly

### Import errors
- Check that the `@/` alias is properly configured in `vitest.config.ts`
- Ensure imports use the correct path aliases

## Continuous Integration

The test suite is designed to be fast and reliable for CI/CD pipelines. All tests should pass before merging pull requests.
