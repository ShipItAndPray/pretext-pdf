import { describe, it, expect } from 'vitest'
import { pxToPoints, pointsToPx, buildCssFont, getFontFamily } from '../src/fonts/fontMetrics.js'
import { PDF_SCALE } from '../src/types.js'

describe('fontMetrics', () => {
  describe('PDF_SCALE', () => {
    it('should be 72/96 = 0.75', () => {
      expect(PDF_SCALE).toBe(0.75)
    })
  })

  describe('pxToPoints', () => {
    it('converts CSS pixels to PDF points', () => {
      expect(pxToPoints(96)).toBe(72) // 1 inch
      expect(pxToPoints(48)).toBe(36)
      expect(pxToPoints(0)).toBe(0)
    })

    it('handles fractional values', () => {
      expect(pxToPoints(10)).toBeCloseTo(7.5)
    })
  })

  describe('pointsToPx', () => {
    it('converts PDF points to CSS pixels', () => {
      expect(pointsToPx(72)).toBe(96) // 1 inch
      expect(pointsToPx(36)).toBe(48)
      expect(pointsToPx(0)).toBe(0)
    })

    it('is the inverse of pxToPoints', () => {
      const px = 123.456
      expect(pointsToPx(pxToPoints(px))).toBeCloseTo(px)
    })
  })

  describe('buildCssFont', () => {
    it('builds a CSS font string from pt size and family', () => {
      const result = buildCssFont(12, 'Helvetica')
      expect(result).toBe('16px Helvetica')
    })

    it('handles different sizes', () => {
      const result = buildCssFont(72, 'Courier')
      expect(result).toBe('96px Courier')
    })
  })

  describe('getFontFamily', () => {
    it('maps Helvetica variants', () => {
      expect(getFontFamily('Helvetica')).toBe('Helvetica')
      expect(getFontFamily('HelveticaBold')).toBe('Helvetica')
      expect(getFontFamily('HelveticaBoldOblique')).toBe('Helvetica')
    })

    it('maps Courier variants', () => {
      expect(getFontFamily('Courier')).toBe('Courier')
      expect(getFontFamily('CourierBold')).toBe('Courier')
    })

    it('maps TimesRoman variants', () => {
      expect(getFontFamily('TimesRoman')).toBe('Times New Roman')
      expect(getFontFamily('TimesRomanBold')).toBe('Times New Roman')
    })
  })
})
