# @shipitandpray/pretext-pdf

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://shipitandpray.github.io/pretext-pdf/) [![GitHub](https://img.shields.io/github/stars/ShipItAndPray/pretext-pdf?style=social)](https://github.com/ShipItAndPray/pretext-pdf)

> **[View Live Demo](https://shipitandpray.github.io/pretext-pdf/)**

Generate multi-page PDFs with proper text wrapping, pagination, and layout using [Pretext](https://github.com/chenglou/pretext) for measurement + [pdf-lib](https://github.com/Hopding/pdf-lib) for rendering.

## The Problem

pdf-lib (the most popular JS PDF library) has **no text wrapping**. You call `page.drawText()` and it draws a single line. Multi-line text requires manual line breaking.

Pretext provides accurate, internationalized line breaking. **pretext-pdf** combines them for proper PDF generation.

**Before (pdf-lib alone):**
```
page.drawText(longParagraph) // => one line that overflows off the page
```

**After (pretext-pdf):**
```
doc.addText(longParagraph) // => wrapped, paginated, beautiful
```

## Install

```bash
npm install @shipitandpray/pretext-pdf
```

## Quick Start

```typescript
import { createPdf } from '@shipitandpray/pretext-pdf'

const doc = createPdf({
  pageSize: 'A4',
  margins: { top: 72, right: 72, bottom: 72, left: 72 },
  defaultFont: 'Helvetica',
  defaultFontSize: 12,
  defaultLineHeight: 16,
})

// Title
await doc.addText('My Document', { fontSize: 24, bold: true, marginBottom: 12 })

// Body text - auto-wraps and paginates
await doc.addText(longParagraph)

// Multi-column layout
await doc.addText(anotherParagraph, { columns: 2, columnGap: 24 })

// Table with auto-sized columns
await doc.addTable({
  headers: ['Name', 'Description', 'Price'],
  rows: data.map(d => [d.name, d.description, `$${d.price}`]),
  columnWidths: 'auto',
})

// Image
await doc.addImage(pngBytes, { width: 200, align: 'center' })

// Generate
const pdfBytes = await doc.build()
```

## API Reference

### `createPdf(options?)`

Create a new PDF document builder.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pageSize` | `'A4' \| 'Letter' \| 'Legal' \| 'A3' \| 'A5' \| 'Tabloid' \| { width, height }` | `'Letter'` | Page dimensions in points |
| `margins` | `{ top, right, bottom, left }` | `72` (1 inch) all sides | Page margins in points |
| `defaultFont` | `StandardFont` | `'Helvetica'` | Default font |
| `defaultFontSize` | `number` | `12` | Default font size in points |
| `defaultLineHeight` | `number` | `16` | Default line height in points |

### `doc.addText(text, options?)`

Add a text block with automatic word wrapping and pagination.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fontSize` | `number` | Document default | Font size in points |
| `lineHeight` | `number` | Document default | Line height in points |
| `font` | `StandardFont` | Document default | Font name |
| `bold` | `boolean` | `false` | Use bold variant |
| `italic` | `boolean` | `false` | Use italic variant |
| `color` | `{ r, g, b }` | `{ r: 0, g: 0, b: 0 }` | Text color (0-255) |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | Text alignment |
| `marginTop` | `number` | `0` | Space above block |
| `marginBottom` | `number` | `0` | Space below block |
| `columns` | `number` | `1` | Number of columns |
| `columnGap` | `number` | `24` | Gap between columns |

### `doc.addTable(options)`

Add a table with optional auto-sized columns. Headers repeat on page breaks.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `headers` | `string[]` | - | Header row cells |
| `rows` | `string[][]` | **required** | Data rows |
| `columnWidths` | `'auto' \| number[]` | `'auto'` | Column widths |
| `headerFont` | `StandardFont` | Cell font | Header font |
| `headerFontSize` | `number` | Cell size | Header font size |
| `cellFont` | `StandardFont` | Document default | Cell font |
| `cellFontSize` | `number` | Document default | Cell font size |
| `cellPadding` | `number` | `8` | Cell padding in points |
| `borderWidth` | `number` | `0.5` | Border line width |
| `borderColor` | `{ r, g, b }` | Black | Border color |
| `headerBackground` | `{ r, g, b }` | - | Header row background |

### `doc.addImage(imageBytes, options?)`

Add a PNG or JPEG image.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | `number` | Original width | Display width in points |
| `height` | `number` | Proportional | Display height in points |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | Horizontal alignment |
| `type` | `'png' \| 'jpg'` | Auto-detected | Image format |
| `marginTop` | `number` | `0` | Space above image |
| `marginBottom` | `number` | `0` | Space below image |

### `doc.addPageBreak()`

Force a new page.

### `doc.build()`

Returns `Promise<Uint8Array>` of the PDF file bytes.

## Page Sizes

| Name | Width | Height | Notes |
|------|-------|--------|-------|
| Letter | 612pt | 792pt | 8.5 x 11 in |
| A4 | 595pt | 842pt | 210 x 297 mm |
| Legal | 612pt | 1008pt | 8.5 x 14 in |
| A3 | 842pt | 1191pt | 297 x 420 mm |
| A5 | 420pt | 595pt | 148 x 210 mm |
| Tabloid | 792pt | 1224pt | 11 x 17 in |

Custom sizes: `{ width: 612, height: 792 }` (in points, 72pt = 1 inch).

## Available Fonts

`Helvetica`, `HelveticaBold`, `HelveticaBoldOblique`, `HelveticaOblique`, `Courier`, `CourierBold`, `CourierBoldOblique`, `CourierOblique`, `TimesRoman`, `TimesRomanBold`, `TimesRomanBoldItalic`, `TimesRomanItalic`

## Font Metrics: CSS px to PDF Points

Pretext measures text in CSS pixels (96 DPI). PDF uses points (72 DPI). The conversion:

```
1 CSS px = 0.75 PDF points
Scale factor: 72 / 96 = 0.75
```

This is handled internally. You work in PDF points throughout the API.

## Architecture

```
src/
  PdfDocument.ts       -- Fluent document builder (createPdf)
  PdfPage.ts           -- Page wrapper with layout helpers
  TextBlock.ts         -- Text measurement via Pretext + rendering
  TableBlock.ts        -- Table layout with auto-sized columns
  ImageBlock.ts        -- Image embedding and placement
  layout/
    FlowLayout.ts      -- Vertical stacking + auto-pagination
    ColumnLayout.ts    -- Multi-column text distribution
    Paginator.ts       -- Page break calculation
  fonts/
    FontLoader.ts      -- PDF font loading + caching
    fontMetrics.ts     -- px/pt conversion utilities
  types.ts             -- All TypeScript types
```

## Demo

Open `demo/index.html` in a browser. Type text on the left, see a live PDF preview on the right. Download the generated PDF with one click.

## Development

```bash
npm install
npm run build    # Build ESM + CJS with tsup
npm test         # Run vitest tests
npm run dev      # Watch mode
```

## License

MIT
