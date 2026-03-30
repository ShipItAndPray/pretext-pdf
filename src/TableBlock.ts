import type { PDFFont, PDFPage } from 'pdf-lib'
import { rgb } from 'pdf-lib'
import type { Margins, TableOptions, StandardFont } from './types.js'
import { measureTextLines, drawTextLines } from './TextBlock.js'

export interface TableLayout {
  columnWidths: number[]
  rowHeights: number[]
  headerHeight: number
  totalHeight: number
}

/**
 * Calculate column widths for a table.
 * If 'auto', measures all cell content and distributes proportionally.
 */
export function calculateColumnWidths(
  options: TableOptions,
  availableWidth: number,
  cellFont: StandardFont,
  cellFontSize: number,
): number[] {
  const numCols = options.headers
    ? options.headers.length
    : options.rows[0]?.length ?? 0
  const padding = options.cellPadding ?? 8

  if (Array.isArray(options.columnWidths)) {
    return options.columnWidths
  }

  // Auto-size: measure max content width per column
  const maxWidths = new Array(numCols).fill(0)

  // Measure headers
  if (options.headers) {
    for (let col = 0; col < numCols; col++) {
      const headerText = options.headers[col] ?? ''
      const lines = measureTextLines(
        headerText,
        availableWidth,
        options.headerFontSize ?? cellFontSize,
        options.headerFont ?? cellFont,
      )
      const maxLineWidth = lines.reduce(
        (max, l) => Math.max(max, l.width),
        0,
      )
      maxWidths[col] = Math.max(maxWidths[col], maxLineWidth + padding * 2)
    }
  }

  // Measure all rows
  for (const row of options.rows) {
    for (let col = 0; col < numCols; col++) {
      const cellText = row[col] ?? ''
      const lines = measureTextLines(
        cellText,
        availableWidth,
        cellFontSize,
        cellFont,
      )
      const maxLineWidth = lines.reduce(
        (max, l) => Math.max(max, l.width),
        0,
      )
      maxWidths[col] = Math.max(maxWidths[col], maxLineWidth + padding * 2)
    }
  }

  // Scale to fit available width if total exceeds it
  const totalDesired = maxWidths.reduce((sum, w) => sum + w, 0)

  if (totalDesired <= availableWidth) {
    // Distribute remaining space proportionally
    const remaining = availableWidth - totalDesired
    const share = remaining / numCols
    return maxWidths.map((w) => w + share)
  }

  // Shrink proportionally
  const scale = availableWidth / totalDesired
  return maxWidths.map((w) => w * scale)
}

/**
 * Calculate row heights by measuring wrapped text in each cell.
 */
export function calculateRowHeights(
  rows: string[][],
  columnWidths: number[],
  fontSize: number,
  lineHeight: number,
  font: StandardFont,
  cellPadding: number,
): number[] {
  return rows.map((row) => {
    let maxCellHeight = lineHeight + cellPadding * 2

    for (let col = 0; col < row.length; col++) {
      const cellWidth = columnWidths[col] - cellPadding * 2
      const lines = measureTextLines(row[col] ?? '', cellWidth, fontSize, font)
      const cellHeight = Math.max(lines.length, 1) * lineHeight + cellPadding * 2
      maxCellHeight = Math.max(maxCellHeight, cellHeight)
    }

    return maxCellHeight
  })
}

/**
 * Draw a single table row onto a page.
 */
export function drawTableRow(
  page: PDFPage,
  cells: string[],
  y: number,
  rowHeight: number,
  columnWidths: number[],
  margins: Margins,
  pdfFont: PDFFont,
  fontSize: number,
  lineHeight: number,
  cellPadding: number,
  borderWidth: number,
  borderColor: { r: number; g: number; b: number },
  background?: { r: number; g: number; b: number },
): void {
  let x = margins.left

  for (let col = 0; col < cells.length; col++) {
    const colWidth = columnWidths[col]

    // Draw background
    if (background) {
      page.drawRectangle({
        x,
        y: y - rowHeight,
        width: colWidth,
        height: rowHeight,
        color: rgb(background.r / 255, background.g / 255, background.b / 255),
      })
    }

    // Draw border
    if (borderWidth > 0) {
      page.drawRectangle({
        x,
        y: y - rowHeight,
        width: colWidth,
        height: rowHeight,
        borderWidth,
        borderColor: rgb(
          borderColor.r / 255,
          borderColor.g / 255,
          borderColor.b / 255,
        ),
      })
    }

    // Draw cell text
    const cellText = cells[col] ?? ''
    if (cellText) {
      const textX = x + cellPadding
      const textY = y - cellPadding - fontSize

      page.drawText(cellText, {
        x: textX,
        y: textY,
        size: fontSize,
        font: pdfFont,
        color: rgb(0, 0, 0),
        maxWidth: colWidth - cellPadding * 2,
      })
    }

    x += colWidth
  }
}
