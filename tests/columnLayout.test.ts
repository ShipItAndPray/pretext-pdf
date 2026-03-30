import { describe, it, expect } from 'vitest'
import { getColumnWidth } from '../src/layout/ColumnLayout.js'

describe('ColumnLayout', () => {
  describe('getColumnWidth', () => {
    it('calculates column width for 2 columns', () => {
      const available = 468
      const gap = 24
      const width = getColumnWidth(available, 2, gap)
      expect(width).toBe((468 - 24) / 2)
      expect(width).toBe(222)
    })

    it('calculates column width for 3 columns', () => {
      const available = 468
      const gap = 12
      const width = getColumnWidth(available, 3, gap)
      expect(width).toBe((468 - 24) / 3)
      expect(width).toBeCloseTo(148)
    })

    it('handles single column (full width)', () => {
      const width = getColumnWidth(468, 1, 24)
      expect(width).toBe(468)
    })

    it('handles zero gap', () => {
      const width = getColumnWidth(468, 2, 0)
      expect(width).toBe(234)
    })
  })
})
