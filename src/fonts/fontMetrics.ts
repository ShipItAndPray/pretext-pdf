import { PDF_SCALE } from '../types.js'

/**
 * Convert Pretext CSS pixel measurements to PDF points.
 * Pretext measures in CSS pixels (96 DPI). PDF uses points (72 DPI).
 * Scale factor: 72/96 = 0.75
 */
export function pxToPoints(px: number): number {
  return px * PDF_SCALE
}

/**
 * Convert PDF points to CSS pixels (for Pretext input).
 */
export function pointsToPx(points: number): number {
  return points / PDF_SCALE
}

/**
 * Build a CSS font string for Pretext's prepare() function.
 * Pretext expects fonts in CSS format: "16px Helvetica"
 */
export function buildCssFont(fontSizePt: number, fontFamily: string): string {
  const fontSizePx = pointsToPx(fontSizePt)
  return `${fontSizePx}px ${fontFamily}`
}

/**
 * Get the base font family name from a StandardFont name.
 * Maps pdf-lib font names to CSS-compatible family names.
 */
export function getFontFamily(standardFont: string): string {
  if (standardFont.startsWith('Courier')) return 'Courier'
  if (standardFont.startsWith('Helvetica')) return 'Helvetica'
  if (standardFont.startsWith('TimesRoman')) return 'Times New Roman'
  return standardFont
}
