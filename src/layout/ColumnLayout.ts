import type { TextLine } from '../TextBlock.js'
import { measureTextLines } from '../TextBlock.js'
import type { Margins, StandardFont } from '../types.js'

export interface ColumnConfig {
  columns: number
  columnGap: number
}

export interface ColumnLine extends TextLine {
  columnIndex: number
  x: number
}

/**
 * Lay out text in multiple columns.
 * Re-measures the text using the column width, then distributes lines
 * across columns as evenly as possible.
 */
export function layoutColumns(
  text: string,
  availableWidth: number,
  margins: Margins,
  config: ColumnConfig,
  fontSize: number,
  fontName: StandardFont,
): ColumnLine[] {
  const { columns, columnGap } = config

  // Calculate column width
  const totalGaps = (columns - 1) * columnGap
  const columnWidth = (availableWidth - totalGaps) / columns

  // Measure text lines at column width
  const lines = measureTextLines(text, columnWidth, fontSize, fontName)

  // Distribute lines across columns evenly
  const linesPerColumn = Math.ceil(lines.length / columns)
  const result: ColumnLine[] = []

  for (let i = 0; i < lines.length; i++) {
    const colIndex = Math.floor(i / linesPerColumn)
    const x = margins.left + colIndex * (columnWidth + columnGap)

    result.push({
      ...lines[i],
      columnIndex: colIndex,
      x,
    })
  }

  return result
}

/**
 * Get the column width for a given configuration.
 */
export function getColumnWidth(
  availableWidth: number,
  columns: number,
  columnGap: number,
): number {
  const totalGaps = (columns - 1) * columnGap
  return (availableWidth - totalGaps) / columns
}
