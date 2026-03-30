import { describe, it, expect } from 'vitest'
import { paginateLines, linesPerRemainingSpace } from '../src/layout/Paginator.js'
import type { TextLine } from '../src/TextBlock.js'

function makeLine(text: string, width: number = 100): TextLine {
  return { text, width }
}

describe('Paginator', () => {
  const margins = { top: 72, right: 72, bottom: 72, left: 72 }
  const pageHeight = 792 // Letter
  const lineHeight = 16

  describe('paginateLines', () => {
    it('keeps all lines on one page when they fit', () => {
      const lines = Array.from({ length: 5 }, (_, i) => makeLine(`Line ${i}`))
      const startY = pageHeight - margins.top // 720

      const chunks = paginateLines(lines, lineHeight, startY, pageHeight, margins, 0)

      expect(chunks).toHaveLength(1)
      expect(chunks[0].pageIndex).toBe(0)
      expect(chunks[0].lines).toHaveLength(5)
    })

    it('splits lines across pages when they overflow', () => {
      const contentHeight = pageHeight - margins.top - margins.bottom // 648
      const linesPerPage = Math.floor(contentHeight / lineHeight) // 40
      const totalLines = linesPerPage + 10 // 50 lines, need 2 pages

      const lines = Array.from({ length: totalLines }, (_, i) => makeLine(`Line ${i}`))
      const startY = pageHeight - margins.top

      const chunks = paginateLines(lines, lineHeight, startY, pageHeight, margins, 0)

      expect(chunks).toHaveLength(2)
      expect(chunks[0].pageIndex).toBe(0)
      expect(chunks[0].lines).toHaveLength(linesPerPage)
      expect(chunks[1].pageIndex).toBe(1)
      expect(chunks[1].lines).toHaveLength(10)
    })

    it('handles starting mid-page', () => {
      const startY = margins.bottom + lineHeight * 3 // room for 3 lines
      const lines = Array.from({ length: 5 }, (_, i) => makeLine(`Line ${i}`))

      const chunks = paginateLines(lines, lineHeight, startY, pageHeight, margins, 0)

      expect(chunks).toHaveLength(2)
      expect(chunks[0].lines).toHaveLength(3)
      expect(chunks[1].lines).toHaveLength(2)
      expect(chunks[1].pageIndex).toBe(1)
    })

    it('returns empty array for empty input', () => {
      const chunks = paginateLines([], lineHeight, pageHeight - margins.top, pageHeight, margins, 0)
      expect(chunks).toHaveLength(0)
    })

    it('respects currentPageIndex offset', () => {
      const lines = [makeLine('Hello')]
      const chunks = paginateLines(lines, lineHeight, pageHeight - margins.top, pageHeight, margins, 3)

      expect(chunks[0].pageIndex).toBe(3)
    })
  })

  describe('linesPerRemainingSpace', () => {
    it('calculates lines that fit in remaining space', () => {
      const currentY = 400
      const bottomMargin = 72
      const result = linesPerRemainingSpace(currentY, lineHeight, bottomMargin)
      expect(result).toBe(Math.floor((400 - 72) / 16))
      expect(result).toBe(20)
    })

    it('returns 0 when no space left', () => {
      expect(linesPerRemainingSpace(72, lineHeight, 72)).toBe(0)
    })

    it('returns 0 when below margin', () => {
      expect(linesPerRemainingSpace(50, lineHeight, 72)).toBe(0)
    })
  })
})
