import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'
import type { PDFFont, PDFPage } from 'pdf-lib'
import { rgb } from 'pdf-lib'
import type { Margins, ResolvedTextOptions, TextAlign } from './types.js'
import { pxToPoints, pointsToPx } from './fonts/fontMetrics.js'
import { FontLoader } from './fonts/FontLoader.js'

export interface TextLine {
  text: string
  width: number // in PDF points
}

/**
 * Measure and break text into lines using Pretext.
 * Returns lines with their widths in PDF points.
 */
export function measureTextLines(
  text: string,
  maxWidthPt: number,
  fontSizePt: number,
  fontName: string,
): TextLine[] {
  if (!text || text.trim() === '') return []

  // Convert PDF points to CSS px for Pretext
  const maxWidthPx = pointsToPx(maxWidthPt)
  const cssFont = FontLoader.getCssFont(fontName as any, fontSizePt)

  // Pretext measurement
  const prepared = prepareWithSegments(text, cssFont)
  const lineHeightPx = pointsToPx(fontSizePt * 1.4) // not used for line breaking, only for height calc
  const result = layoutWithLines(prepared, maxWidthPx, lineHeightPx)

  return result.lines.map((line) => ({
    text: line.text,
    width: pxToPoints(line.width),
  }))
}

/**
 * Calculate alignment offset for a line of text.
 */
export function getAlignOffset(
  lineWidth: number,
  availableWidth: number,
  align: TextAlign,
): number {
  switch (align) {
    case 'center':
      return (availableWidth - lineWidth) / 2
    case 'right':
      return availableWidth - lineWidth
    case 'left':
    default:
      return 0
  }
}

/**
 * Draw pre-measured text lines onto a PDF page.
 * Returns the new Y position after drawing.
 */
export function drawTextLines(
  page: PDFPage,
  lines: TextLine[],
  startY: number,
  margins: Margins,
  options: ResolvedTextOptions,
): number {
  const availableWidth =
    page.getWidth() - margins.left - margins.right
  let y = startY

  const { r, g, b: bl } = options.color

  for (const line of lines) {
    const xOffset = getAlignOffset(line.width, availableWidth, options.align)

    page.drawText(line.text, {
      x: margins.left + xOffset,
      y,
      size: options.fontSize,
      font: options.pdfFont,
      color: rgb(r / 255, g / 255, bl / 255),
    })

    y -= options.lineHeight
  }

  return y
}
