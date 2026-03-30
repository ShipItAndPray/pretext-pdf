import type { PDFFont, PDFPage } from 'pdf-lib'

/** CSS px to PDF points scale factor. At 96 DPI: 1 CSS px = 0.75 pt */
export const PDF_SCALE = 72 / 96

/** Standard page sizes in PDF points (1pt = 1/72 inch) */
export const PAGE_SIZES = {
  A4: { width: 595.28, height: 841.89 },
  Letter: { width: 612, height: 792 },
  Legal: { width: 612, height: 1008 },
  Tabloid: { width: 792, height: 1224 },
  A3: { width: 841.89, height: 1190.55 },
  A5: { width: 419.53, height: 595.28 },
} as const

export type PageSizeName = keyof typeof PAGE_SIZES

export type PageSize = PageSizeName | { width: number; height: number }

export interface Margins {
  top: number
  right: number
  bottom: number
  left: number
}

export type TextAlign = 'left' | 'center' | 'right'

export interface DocumentOptions {
  pageSize?: PageSize
  margins?: Partial<Margins>
  defaultFont?: StandardFont
  defaultFontSize?: number
  defaultLineHeight?: number
}

export interface TextOptions {
  fontSize?: number
  lineHeight?: number
  font?: StandardFont
  bold?: boolean
  italic?: boolean
  color?: { r: number; g: number; b: number }
  align?: TextAlign
  marginTop?: number
  marginBottom?: number
  columns?: number
  columnGap?: number
}

export interface TableOptions {
  headers?: string[]
  rows: string[][]
  columnWidths?: 'auto' | number[]
  headerFont?: StandardFont
  headerFontSize?: number
  cellFont?: StandardFont
  cellFontSize?: number
  cellPadding?: number
  borderWidth?: number
  borderColor?: { r: number; g: number; b: number }
  headerBackground?: { r: number; g: number; b: number }
  lineHeight?: number
}

export interface ImageOptions {
  width?: number
  height?: number
  align?: TextAlign
  marginTop?: number
  marginBottom?: number
}

export type StandardFont =
  | 'Courier'
  | 'CourierBold'
  | 'CourierBoldOblique'
  | 'CourierOblique'
  | 'Helvetica'
  | 'HelveticaBold'
  | 'HelveticaBoldOblique'
  | 'HelveticaOblique'
  | 'TimesRoman'
  | 'TimesRomanBold'
  | 'TimesRomanBoldItalic'
  | 'TimesRomanItalic'

export interface ResolvedTextOptions {
  fontSize: number
  lineHeight: number
  font: StandardFont
  color: { r: number; g: number; b: number }
  align: TextAlign
  marginTop: number
  marginBottom: number
  columns: number
  columnGap: number
  pdfFont: PDFFont
}

/** A renderable block that can be placed on pages */
export interface Block {
  /** Render this block starting at the given Y position on the given page.
   *  Returns the Y position after the block, or null if a new page is needed. */
  type: 'text' | 'table' | 'image'
}

export interface TextBlock extends Block {
  type: 'text'
  text: string
  options: TextOptions
}

export interface TableBlock extends Block {
  type: 'table'
  options: TableOptions
}

export interface ImageBlock extends Block {
  type: 'image'
  imageBytes: Uint8Array
  imageType: 'png' | 'jpg'
  options: ImageOptions
}

export type AnyBlock = TextBlock | TableBlock | ImageBlock
