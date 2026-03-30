import { describe, it, expect } from 'vitest'
import { getAlignOffset } from '../src/TextBlock.js'

describe('TextBlock', () => {
  describe('getAlignOffset', () => {
    const availableWidth = 468 // Letter width minus 72pt margins on each side

    it('returns 0 for left alignment', () => {
      expect(getAlignOffset(200, availableWidth, 'left')).toBe(0)
    })

    it('centers text', () => {
      const lineWidth = 200
      const expected = (availableWidth - lineWidth) / 2
      expect(getAlignOffset(lineWidth, availableWidth, 'center')).toBe(expected)
      expect(getAlignOffset(lineWidth, availableWidth, 'center')).toBe(134)
    })

    it('right-aligns text', () => {
      const lineWidth = 200
      expect(getAlignOffset(lineWidth, availableWidth, 'right')).toBe(268)
    })

    it('handles full-width line', () => {
      expect(getAlignOffset(availableWidth, availableWidth, 'center')).toBe(0)
      expect(getAlignOffset(availableWidth, availableWidth, 'right')).toBe(0)
    })
  })
})
