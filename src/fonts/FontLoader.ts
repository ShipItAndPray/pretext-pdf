import { PDFDocument, PDFFont, StandardFonts } from 'pdf-lib'
import type { StandardFont } from '../types.js'
import { buildCssFont, getFontFamily } from './fontMetrics.js'

/** Maps our StandardFont names to pdf-lib's StandardFonts enum values */
const FONT_MAP: Record<StandardFont, StandardFonts> = {
  Courier: StandardFonts.Courier,
  CourierBold: StandardFonts.CourierBold,
  CourierBoldOblique: StandardFonts.CourierBoldOblique,
  CourierOblique: StandardFonts.CourierOblique,
  Helvetica: StandardFonts.Helvetica,
  HelveticaBold: StandardFonts.HelveticaBold,
  HelveticaBoldOblique: StandardFonts.HelveticaBoldOblique,
  HelveticaOblique: StandardFonts.HelveticaOblique,
  TimesRoman: StandardFonts.TimesRoman,
  TimesRomanBold: StandardFonts.TimesRomanBold,
  TimesRomanBoldItalic: StandardFonts.TimesRomanBoldItalic,
  TimesRomanItalic: StandardFonts.TimesRomanItalic,
}

export class FontLoader {
  private cache = new Map<string, PDFFont>()
  private pdfDoc: PDFDocument

  constructor(pdfDoc: PDFDocument) {
    this.pdfDoc = pdfDoc
  }

  /** Load a standard PDF font, caching the result */
  async load(fontName: StandardFont): Promise<PDFFont> {
    if (this.cache.has(fontName)) {
      return this.cache.get(fontName)!
    }

    const stdFont = FONT_MAP[fontName]
    if (!stdFont) {
      throw new Error(`Unknown standard font: ${fontName}`)
    }

    const pdfFont = await this.pdfDoc.embedFont(stdFont)
    this.cache.set(fontName, pdfFont)
    return pdfFont
  }

  /**
   * Resolve a font name considering bold/italic modifiers.
   * Returns the appropriate StandardFont variant.
   */
  static resolveFontVariant(
    base: StandardFont,
    bold?: boolean,
    italic?: boolean,
  ): StandardFont {
    if (!bold && !italic) return base

    const family = getFontFamily(base)

    if (family === 'Helvetica') {
      if (bold && italic) return 'HelveticaBoldOblique'
      if (bold) return 'HelveticaBold'
      if (italic) return 'HelveticaOblique'
    } else if (family === 'Courier') {
      if (bold && italic) return 'CourierBoldOblique'
      if (bold) return 'CourierBold'
      if (italic) return 'CourierOblique'
    } else if (family === 'Times New Roman') {
      if (bold && italic) return 'TimesRomanBoldItalic'
      if (bold) return 'TimesRomanBold'
      if (italic) return 'TimesRomanItalic'
    }

    return base
  }

  /** Get the CSS font string for Pretext measurement */
  static getCssFont(fontName: StandardFont, fontSizePt: number): string {
    return buildCssFont(fontSizePt, getFontFamily(fontName))
  }
}
