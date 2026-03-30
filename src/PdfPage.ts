import type { PDFPage } from 'pdf-lib'
import type { Margins } from './types.js'

/**
 * Wrapper around a pdf-lib PDFPage with layout-aware helpers.
 */
export class PdfPageWrapper {
  readonly page: PDFPage
  readonly margins: Margins
  readonly contentWidth: number
  readonly contentHeight: number

  constructor(page: PDFPage, margins: Margins) {
    this.page = page
    this.margins = margins
    this.contentWidth = page.getWidth() - margins.left - margins.right
    this.contentHeight = page.getHeight() - margins.top - margins.bottom
  }

  /** Top of the content area (Y coordinate for first line) */
  get contentTop(): number {
    return this.page.getHeight() - this.margins.top
  }

  /** Bottom of the content area */
  get contentBottom(): number {
    return this.margins.bottom
  }

  /** Left edge of content area */
  get contentLeft(): number {
    return this.margins.left
  }

  /** Width of the underlying page */
  get width(): number {
    return this.page.getWidth()
  }

  /** Height of the underlying page */
  get height(): number {
    return this.page.getHeight()
  }
}
