import { PDFDocument, PDFPage, rgb } from 'pdf-lib'
import type {
  Margins,
  ResolvedTextOptions,
  StandardFont,
  TableOptions,
  ImageOptions,
  AnyBlock,
  TextBlock as TextBlockType,
  TableBlock as TableBlockType,
  ImageBlock as ImageBlockType,
} from '../types.js'
import { PAGE_SIZES } from '../types.js'
import {
  measureTextLines,
  drawTextLines,
  getAlignOffset,
  type TextLine,
} from '../TextBlock.js'
import {
  calculateColumnWidths,
  calculateRowHeights,
  drawTableRow,
} from '../TableBlock.js'
import { embedImage, calculateImageDimensions, drawImage } from '../ImageBlock.js'
import { paginateLines } from './Paginator.js'
import { layoutColumns, type ColumnLine } from './ColumnLayout.js'
import { FontLoader } from '../fonts/FontLoader.js'

/**
 * FlowLayout manages vertical stacking of blocks with automatic pagination.
 * Blocks are added sequentially and flow across pages as needed.
 */
export class FlowLayout {
  private currentY: number
  private currentPage: PDFPage
  private pages: PDFPage[] = []
  private pdfDoc: PDFDocument
  private margins: Margins
  private pageWidth: number
  private pageHeight: number
  private fontLoader: FontLoader

  // Default text options
  private defaultFont: StandardFont
  private defaultFontSize: number
  private defaultLineHeight: number

  constructor(
    pdfDoc: PDFDocument,
    pageWidth: number,
    pageHeight: number,
    margins: Margins,
    fontLoader: FontLoader,
    defaultFont: StandardFont = 'Helvetica',
    defaultFontSize: number = 12,
    defaultLineHeight: number = 16,
  ) {
    this.pdfDoc = pdfDoc
    this.pageWidth = pageWidth
    this.pageHeight = pageHeight
    this.margins = margins
    this.fontLoader = fontLoader
    this.defaultFont = defaultFont
    this.defaultFontSize = defaultFontSize
    this.defaultLineHeight = defaultLineHeight

    // Create first page
    this.currentPage = this.newPage()
    this.currentY = pageHeight - margins.top
  }

  /** Get available content width */
  get availableWidth(): number {
    return this.pageWidth - this.margins.left - this.margins.right
  }

  /** Create a new page and track it */
  private newPage(): PDFPage {
    const page = this.pdfDoc.addPage([this.pageWidth, this.pageHeight])
    this.pages.push(page)
    this.currentPage = page
    this.currentY = this.pageHeight - this.margins.top
    return page
  }

  /** Ensure there's enough space, creating a new page if needed */
  private ensureSpace(height: number): void {
    if (this.currentY - height < this.margins.bottom) {
      this.newPage()
    }
  }

  /** Add a text block with word wrapping and auto-pagination */
  async addText(text: string, options: Partial<ResolvedTextOptions> = {}): Promise<void> {
    const fontSize = options.fontSize ?? this.defaultFontSize
    const lineHeight = options.lineHeight ?? this.defaultLineHeight
    const fontName = options.font ?? this.defaultFont
    const resolvedFont = FontLoader.resolveFontVariant(
      fontName,
      false,
      false,
    )
    const align = options.align ?? 'left'
    const color = options.color ?? { r: 0, g: 0, b: 0 }
    const marginTop = options.marginTop ?? 0
    const marginBottom = options.marginBottom ?? 0
    const columns = options.columns ?? 1

    // Apply top margin
    this.currentY -= marginTop

    const pdfFont = await this.fontLoader.load(resolvedFont)

    if (columns > 1) {
      await this.addMultiColumnText(text, {
        fontSize,
        lineHeight,
        font: resolvedFont,
        align,
        color,
        marginTop: 0,
        marginBottom,
        columns,
        columnGap: options.columnGap ?? 24,
        pdfFont,
      })
      return
    }

    // Measure and break text into lines
    const lines = measureTextLines(text, this.availableWidth, fontSize, resolvedFont)

    // Paginate lines
    const chunks = paginateLines(
      lines,
      lineHeight,
      this.currentY,
      this.pageHeight,
      this.margins,
      this.pages.length - 1,
    )

    // Draw each chunk on its page
    for (const chunk of chunks) {
      // Create new pages if needed
      while (this.pages.length - 1 < chunk.pageIndex) {
        this.newPage()
      }
      const page = this.pages[chunk.pageIndex]

      const startY =
        chunk.pageIndex === this.pages.length - 1
          ? this.currentY
          : this.pageHeight - this.margins.top

      const resolvedOptions: ResolvedTextOptions = {
        fontSize,
        lineHeight,
        font: resolvedFont,
        align,
        color,
        marginTop: 0,
        marginBottom: 0,
        columns: 1,
        columnGap: 0,
        pdfFont,
      }

      drawTextLines(page, chunk.lines, startY, this.margins, resolvedOptions)

      // Update currentY after the last chunk
      if (chunk === chunks[chunks.length - 1]) {
        this.currentPage = page
        this.currentY = startY - chunk.lines.length * lineHeight
      }
    }

    // Apply bottom margin
    this.currentY -= marginBottom
  }

  /** Add multi-column text */
  private async addMultiColumnText(
    text: string,
    options: ResolvedTextOptions,
  ): Promise<void> {
    const columnLines = layoutColumns(
      text,
      this.availableWidth,
      this.margins,
      { columns: options.columns, columnGap: options.columnGap },
      options.fontSize,
      options.font,
    )

    // Group lines by column
    const columnGroups = new Map<number, ColumnLine[]>()
    for (const line of columnLines) {
      const group = columnGroups.get(line.columnIndex) ?? []
      group.push(line)
      columnGroups.set(line.columnIndex, group)
    }

    // Find max height across columns
    let maxLines = 0
    for (const [, group] of columnGroups) {
      maxLines = Math.max(maxLines, group.length)
    }

    const totalHeight = maxLines * options.lineHeight
    this.ensureSpace(totalHeight)

    // Draw each column
    const { r, g, b: bl } = options.color
    for (const [, group] of columnGroups) {
      let y = this.currentY
      for (const line of group) {
        this.currentPage.drawText(line.text, {
          x: line.x,
          y,
          size: options.fontSize,
          font: options.pdfFont,
          color: rgb(r / 255, g / 255, bl / 255),
        })
        y -= options.lineHeight
      }
    }

    this.currentY -= totalHeight
    this.currentY -= options.marginBottom
  }

  /** Add a table with auto-sized columns and pagination */
  async addTable(options: TableOptions): Promise<void> {
    const cellFont = options.cellFont ?? this.defaultFont
    const cellFontSize = options.cellFontSize ?? this.defaultFontSize
    const headerFont = options.headerFont ?? cellFont
    const headerFontSize = options.headerFontSize ?? cellFontSize
    const cellPadding = options.cellPadding ?? 8
    const borderWidth = options.borderWidth ?? 0.5
    const borderColor = options.borderColor ?? { r: 0, g: 0, b: 0 }
    const lineHeight = options.lineHeight ?? this.defaultLineHeight

    const pdfCellFont = await this.fontLoader.load(cellFont)
    const pdfHeaderFont = await this.fontLoader.load(headerFont)

    // Calculate column widths
    const columnWidths = calculateColumnWidths(
      options,
      this.availableWidth,
      cellFont,
      cellFontSize,
    )

    // Calculate row heights
    const rowHeights = calculateRowHeights(
      options.rows,
      columnWidths,
      cellFontSize,
      lineHeight,
      cellFont,
      cellPadding,
    )

    // Draw header
    const drawHeader = (y: number): number => {
      if (options.headers) {
        const headerHeight = lineHeight + cellPadding * 2
        drawTableRow(
          this.currentPage,
          options.headers,
          y,
          headerHeight,
          columnWidths,
          this.margins,
          pdfHeaderFont,
          headerFontSize,
          lineHeight,
          cellPadding,
          borderWidth,
          borderColor,
          options.headerBackground,
        )
        return y - headerHeight
      }
      return y
    }

    // Draw header on current page
    this.currentY = drawHeader(this.currentY)

    // Draw rows with pagination
    for (let i = 0; i < options.rows.length; i++) {
      const rowHeight = rowHeights[i]

      // Check if row fits on current page
      if (this.currentY - rowHeight < this.margins.bottom) {
        this.newPage()
        // Repeat header on new page
        this.currentY = drawHeader(this.currentY)
      }

      drawTableRow(
        this.currentPage,
        options.rows[i],
        this.currentY,
        rowHeight,
        columnWidths,
        this.margins,
        pdfCellFont,
        cellFontSize,
        lineHeight,
        cellPadding,
        borderWidth,
        borderColor,
      )

      this.currentY -= rowHeight
    }
  }

  /** Add an image with optional sizing and alignment */
  async addImage(
    imageBytes: Uint8Array,
    imageType: 'png' | 'jpg',
    options: ImageOptions = {},
  ): Promise<void> {
    const marginTop = options.marginTop ?? 0
    const marginBottom = options.marginBottom ?? 0

    this.currentY -= marginTop

    const embedded = await (imageType === 'png'
      ? this.pdfDoc.embedPng(imageBytes)
      : this.pdfDoc.embedJpg(imageBytes))

    const embeddedImage = {
      width: embedded.width,
      height: embedded.height,
      image: embedded,
    }

    const dims = calculateImageDimensions(
      embeddedImage,
      options,
      this.availableWidth,
    )

    this.ensureSpace(dims.height)

    const xOffset = getAlignOffset(
      dims.width,
      this.availableWidth,
      options.align ?? 'left',
    )

    this.currentPage.drawImage(embedded, {
      x: this.margins.left + xOffset,
      y: this.currentY - dims.height,
      width: dims.width,
      height: dims.height,
    })

    this.currentY -= dims.height + marginBottom
  }

  /** Get all pages */
  getPages(): PDFPage[] {
    return this.pages
  }

  /** Get current page count */
  get pageCount(): number {
    return this.pages.length
  }

  /** Get current Y position */
  getCurrentY(): number {
    return this.currentY
  }
}
