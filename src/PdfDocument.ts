import { PDFDocument as PdfLibDocument } from 'pdf-lib'
import type {
  DocumentOptions,
  Margins,
  PageSize,
  StandardFont,
  TextOptions,
  TableOptions,
  ImageOptions,
} from './types.js'
import { PAGE_SIZES } from './types.js'
import { FlowLayout } from './layout/FlowLayout.js'
import { FontLoader } from './fonts/FontLoader.js'

const DEFAULT_MARGINS: Margins = {
  top: 72,
  right: 72,
  bottom: 72,
  left: 72,
}

/**
 * High-level document builder with a fluent API.
 * Combines Pretext text measurement with pdf-lib rendering.
 *
 * Usage:
 *   const doc = createPdf({ pageSize: 'A4' })
 *   doc.addText('Hello World', { fontSize: 24, bold: true })
 *   const bytes = await doc.build()
 */
export class PdfDocument {
  private pdfDoc!: PdfLibDocument
  private layout!: FlowLayout
  private fontLoader!: FontLoader
  private options: Required<DocumentOptions>
  private initialized = false

  private pageWidth: number
  private pageHeight: number
  private margins: Margins

  constructor(options: DocumentOptions = {}) {
    const pageSize = resolvePageSize(options.pageSize ?? 'Letter')
    this.pageWidth = pageSize.width
    this.pageHeight = pageSize.height
    this.margins = { ...DEFAULT_MARGINS, ...options.margins }

    this.options = {
      pageSize: options.pageSize ?? 'Letter',
      margins: this.margins,
      defaultFont: options.defaultFont ?? 'Helvetica',
      defaultFontSize: options.defaultFontSize ?? 12,
      defaultLineHeight: options.defaultLineHeight ?? 16,
    }
  }

  /** Lazily initialize the PDF document and layout engine */
  private async init(): Promise<void> {
    if (this.initialized) return

    this.pdfDoc = await PdfLibDocument.create()
    this.fontLoader = new FontLoader(this.pdfDoc)
    this.layout = new FlowLayout(
      this.pdfDoc,
      this.pageWidth,
      this.pageHeight,
      this.margins,
      this.fontLoader,
      this.options.defaultFont as StandardFont,
      this.options.defaultFontSize as number,
      this.options.defaultLineHeight as number,
    )
    this.initialized = true
  }

  /** Add a text block. Auto-wraps using Pretext and paginates if needed. */
  async addText(text: string, options: TextOptions = {}): Promise<PdfDocument> {
    await this.init()

    const resolvedFont = FontLoader.resolveFontVariant(
      (options.font ?? this.options.defaultFont) as StandardFont,
      options.bold,
      options.italic,
    )

    const pdfFont = await this.fontLoader.load(resolvedFont)

    await this.layout.addText(text, {
      fontSize: options.fontSize ?? (this.options.defaultFontSize as number),
      lineHeight: options.lineHeight ?? (this.options.defaultLineHeight as number),
      font: resolvedFont,
      align: options.align ?? 'left',
      color: options.color ?? { r: 0, g: 0, b: 0 },
      marginTop: options.marginTop ?? 0,
      marginBottom: options.marginBottom ?? 0,
      columns: options.columns ?? 1,
      columnGap: options.columnGap ?? 24,
      pdfFont,
    })

    return this
  }

  /** Add a table with auto-sized columns. Headers repeat on page breaks. */
  async addTable(options: TableOptions): Promise<PdfDocument> {
    await this.init()
    await this.layout.addTable(options)
    return this
  }

  /** Add an image (PNG or JPEG bytes). */
  async addImage(
    imageBytes: Uint8Array,
    options: ImageOptions & { type?: 'png' | 'jpg' } = {},
  ): Promise<PdfDocument> {
    await this.init()

    const imageType = options.type ?? detectImageType(imageBytes)
    await this.layout.addImage(imageBytes, imageType, options)

    return this
  }

  /** Add a page break manually. */
  async addPageBreak(): Promise<PdfDocument> {
    await this.init()
    // Add text with empty content that forces a new page
    // by consuming all remaining space
    await this.layout.addText('\n', {
      fontSize: 1,
      lineHeight: this.pageHeight,
      font: (this.options.defaultFont as StandardFont),
      align: 'left',
      color: { r: 255, g: 255, b: 255 },
      marginTop: 0,
      marginBottom: 0,
      columns: 1,
      columnGap: 0,
      pdfFont: await this.fontLoader.load(this.options.defaultFont as StandardFont),
    })
    return this
  }

  /** Get the current page count */
  get pageCount(): number {
    return this.layout?.pageCount ?? 0
  }

  /** Build and return the PDF bytes */
  async build(): Promise<Uint8Array> {
    await this.init()
    return this.pdfDoc.save()
  }
}

/** Resolve a page size name or custom dimensions */
function resolvePageSize(size: PageSize): { width: number; height: number } {
  if (typeof size === 'string') {
    const preset = PAGE_SIZES[size]
    if (!preset) {
      throw new Error(
        `Unknown page size: ${size}. Available: ${Object.keys(PAGE_SIZES).join(', ')}`,
      )
    }
    return { width: preset.width, height: preset.height }
  }
  return size
}

/** Detect image type from magic bytes */
function detectImageType(bytes: Uint8Array): 'png' | 'jpg' {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'png'
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return 'jpg'
  }
  return 'png' // default
}

/**
 * Create a new PDF document with the fluent API.
 *
 * @example
 * const doc = createPdf({ pageSize: 'A4', margins: { top: 72, right: 72, bottom: 72, left: 72 } })
 * await doc.addText('Hello World', { fontSize: 24, bold: true })
 * const pdfBytes = await doc.build()
 */
export function createPdf(options?: DocumentOptions): PdfDocument {
  return new PdfDocument(options)
}
