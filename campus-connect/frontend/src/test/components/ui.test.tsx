import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

describe('UI Components', () => {
  describe('Button', () => {
    it('should be defined', async () => {
      const { Button } = await import('@/components/ui/button')
      expect(Button).toBeDefined()
    })
  })

  describe('Input', () => {
    it('should be defined', async () => {
      const { Input } = await import('@/components/ui/input')
      expect(Input).toBeDefined()
    })
  })

  describe('Card', () => {
    it('should be defined', async () => {
      const { Card } = await import('@/components/ui/card')
      expect(Card).toBeDefined()
    })
  })

  describe('Avatar', () => {
    it('should be defined', async () => {
      const { Avatar } = await import('@/components/ui/avatar')
      expect(Avatar).toBeDefined()
    })
  })

  describe('Textarea', () => {
    it('should be defined', async () => {
      const { Textarea } = await import('@/components/ui/textarea')
      expect(Textarea).toBeDefined()
    })
  })
})
