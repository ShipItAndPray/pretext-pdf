import type { PDFPage } from 'pdf-lib'
import type { Margins } from '../types.js'
import type { TextLine } from '../TextBlock.js'

export interface PaginatedChunk {
  lines: TextLine[]
  pageIndex: number
}

/**
 * Split an array of text lines across pages based on available height.
 * Returns chunks of lines assigned to page indices.
 *
 * @param lines - Pre-measured lines of text
 * @param lineHeight - Height per line in PDF points
 * @param startY - Current Y position on the current page
 * @param pageHeight - Total page height in points
 * @param margins - Page margins
 * @param currentPageIndex - Index of the current page
 */
export function paginateLines(
  lines: TextLine[],
  lineHeight: number,
  startY: number,
  pageHeight: number,
  margins: Margins,
  currentPageIndex: number,
): PaginatedChunk[] {
  const chunks: PaginatedChunk[] = []
  let currentChunk: TextLine[] = []
  let y = startY
  let pageIndex = currentPageIndex
  const bottomLimit = margins.bottom

  for (const line of lines) {
    if (y - lineHeight < bottomLimit) {
      // Save current chunk if it has lines
      if (currentChunk.length > 0) {
        chunks.push({ lines: currentChunk, pageIndex })
      }
      // Start new page
      pageIndex++
      currentChunk = []
      y = pageHeight - margins.top
    }

    currentChunk.push(line)
    y -= lineHeight
  }

  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    chunks.push({ lines: currentChunk, pageIndex })
  }

  return chunks
}

/**
 * Calculate how many lines fit on the remaining space of a page.
 */
export function linesPerRemainingSpace(
  currentY: number,
  lineHeight: number,
  bottomMargin: number,
): number {
  const available = currentY - bottomMargin
  return Math.max(0, Math.floor(available / lineHeight))
}
