import type { PDFPage, PDFDocument } from 'pdf-lib'
import type { ImageOptions, Margins, TextAlign } from './types.js'
import { getAlignOffset } from './TextBlock.js'

export interface EmbeddedImage {
  width: number
  height: number
  image: Awaited<ReturnType<PDFDocument['embedPng']>>
}

/**
 * Embed an image into the PDF document.
 */
export async function embedImage(
  doc: PDFDocument,
  imageBytes: Uint8Array,
  imageType: 'png' | 'jpg',
): Promise<EmbeddedImage> {
  const image =
    imageType === 'png'
      ? await doc.embedPng(imageBytes)
      : await doc.embedJpg(imageBytes)

  return {
    width: image.width,
    height: image.height,
    image,
  }
}

/**
 * Calculate image dimensions respecting aspect ratio.
 */
export function calculateImageDimensions(
  embedded: EmbeddedImage,
  options: ImageOptions,
  availableWidth: number,
): { width: number; height: number } {
  const aspect = embedded.width / embedded.height

  let width = options.width ?? embedded.width
  let height = options.height ?? width / aspect

  // Clamp to available width
  if (width > availableWidth) {
    width = availableWidth
    height = width / aspect
  }

  if (options.height && !options.width) {
    height = options.height
    width = height * aspect
    if (width > availableWidth) {
      width = availableWidth
      height = width / aspect
    }
  }

  return { width, height }
}

/**
 * Draw an embedded image onto a page.
 */
export function drawImage(
  page: PDFPage,
  embedded: EmbeddedImage,
  y: number,
  margins: Margins,
  options: ImageOptions,
  availableWidth: number,
): number {
  const dims = calculateImageDimensions(embedded, options, availableWidth)
  const xOffset = getAlignOffset(dims.width, availableWidth, options.align ?? 'left')

  page.drawImage(embedded.image, {
    x: margins.left + xOffset,
    y: y - dims.height,
    width: dims.width,
    height: dims.height,
  })

  return y - dims.height - (options.marginBottom ?? 0)
}
