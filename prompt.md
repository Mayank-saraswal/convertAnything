You are a senior full-stack engineer. Build a production-grade, legally-admissible E-Signature feature for a PDF SaaS platform (PDFvault) using the following exact stack:

MONOREPO: Turborepo + pnpm
FRONTEND: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
API: Express + tRPC v11
AUTH: Clerk
STORAGE: Azure Blob Storage
QUEUE: BullMQ + Redis (Upstash)
DATABASE: PostgreSQL + Drizzle ORM (Neon)
DESIGN: white #FFFFFF bg, black #000000 headings, gray #6F6F6F muted, Instrument Serif display font, Inter body font, rounded-full pill buttons

SIGNATURE CAPTURE MODES:
1. Draw mode — HTML5 Canvas with signature_pad library
   - Pressure simulation using pointer event velocity
   - Variable stroke width (min 1.5px, max 4px based on speed)
   - Bezier curve smoothing (tension 0.5)
   - Clear, undo-last-stroke, redo buttons
   - Export as transparent PNG

2. Type mode — User types name, rendered in 5 handwriting fonts:
   - Dancing Script, Pacifico, Caveat, Great Vibes, Sacramento
   - Import from Google Fonts in /styles/fonts.css
   - Render to canvas offscreen, export as PNG
   - Color picker: black, navy, blue ink choices

3. Upload mode — User uploads image of signature
   - Accept: image/png, image/jpeg, image/webp, max 2MB
   - Auto-remove white background using sharp: sharp(buffer).threshold(200).negate().png().toBuffer()

PDF PLACEMENT ENGINE:
- Render PDF pages using PDF.js (pdfjs-dist)
- Overlay HTML div layer for drag-and-drop signature placement (@dnd-kit/core)
- Resize handles on signature element (corner grips)
- Store placement as: { pageIndex, x, y, width, height, rotation }
  where x, y are percentages of page dimensions (0-100) for DPI independence

COORDINATE SYSTEM (CRITICAL):
PDF coordinate origin is BOTTOM-LEFT in pdf-lib, but screen is TOP-LEFT.
Transform: pdfY = pageHeight - (placementY/100 * pageHeight) - (sigHeight)
Transform: pdfX = placementX/100 * pageWidth

SIGNATURE EMBEDDING (apps/worker/processors/sign.processor.ts):
1. Download original PDF from Azure Blob
2. Download signature PNG from Azure Blob
3. Load with PDFDocument.load(pdfBytes)
4. Embed PNG with pdfDoc.embedPng(signatureBytes)
5. Compute pdfX, pdfY from percentage coordinates
6. page.drawImage(sigImage, { x: pdfX, y: pdfY, width: sigW, height: sigH, opacity: 1 })
7. Add invisible text for searchability: page.drawText('Signed by: ' + userName, { size: 0.1, color: rgb(1,1,1) })
8. Upload output to Azure Blob, update job record

DATABASE SCHEMA:
signatures table: id, clerkUserId, name, signatureType (draw/type/upload), signatureBlob (Azure key), ipAddress, userAgent, createdAt, expiresAt (30 days)
signature_requests table: id, documentId, clerkUserId, signerEmail, status (pending/signed/declined/expired), placements (jsonb), signedAt, signatureId, auditLog (jsonb array), expiresAt, createdAt

AUDIT TRAIL (legally required):
Each signing event must record:
- IP address, timestamp (UTC ISO 8601), user agent
- Geolocation (Cloudflare cf-ipcountry header)
- Action: document_viewed | signature_drawn | document_signed | document_downloaded
- Document hash (SHA-256 of original PDF bytes before signing)

After signing: generate Certificate of Completion PDF using pdf-lib with all audit events.
Comply with: eIDAS (EU), ESIGN Act (US), IT Act 2000 (India) — Simple Electronic Signature (SES)

tRPC ROUTES:
sign.saveSignature — upload sig PNG to Azure, store in DB, return signatureId
sign.requestSign — create signature_request, send email (Resend API)
sign.getDocument — fetch PDF SAS URL + placement config
sign.submitSign — record placement, trigger BullMQ flatten job
sign.getStatus — poll job status
sign.downloadSigned — generate 1hr Azure SAS URL for signed PDF

FRONTEND PAGES:
/sign-pdf — main tool page (SEO static page)
/sign-pdf/[requestId] — signing page (dynamic)
/dashboard/signatures — signature history

DESIGN:
- Signature canvas: white bg, subtle #E8E8E8 baseline guide
- "Your signature" preview: black border, 240x100px fixed
- Signing page: 70% PDF preview left, 30% signature panel right
- Progress: 3 steps — Create signature → Place → Sign

SECURITY:
- Request links expire in 72 hours
- One-time-use tokens for unauthenticated signers
- Rate limit: 5 signatures/hour per IP (Redis sliding window)
- Signature PNG in private Azure container (no public access)
- Download via SAS URL only (1hr expiry)
- GDPR: signature data deletion endpoint

Implement ALL of the above completely. No shortcuts. Write production TypeScript with full Zod validation, error handling with try/catch everywhere, and tRPC error codes (BAD_REQUEST, UNAUTHORIZED, NOT_FOUND, INTERNAL_SERVER_ERROR). Follow the existing Turborepo package structure.









You are a senior full-stack engineer. Build a production-grade PDF Editor feature for PDFvault. This is the most technically complex feature in the product. Follow all architectural decisions exactly.

MONOREPO: Turborepo + pnpm
FRONTEND: Next.js 15, TypeScript, Tailwind CSS, Fabric.js (canvas editing layer), react-pdf (PDF rendering)
API: Express + tRPC v11
AUTH: Clerk (optional — editor works anonymously)
STORAGE: Azure Blob Storage
QUEUE: BullMQ + Redis for flatten job
DATABASE: PostgreSQL + Drizzle ORM (Neon)
DESIGN: white bg, black #000000, gray #6F6F6F, Instrument Serif + Inter, pill buttons

ARCHITECTURE — TWO-LAYER APPROACH:
NEVER attempt to modify the underlying PDF binary directly in real-time.

Layer 1 — PDF Render Layer (read-only):
- Render each PDF page as high-DPI canvas using PDF.js (pdfjs-dist)
- Scale: 2x devicePixelRatio for retina
- position: absolute, z-index 0, pointer-events: none

Layer 2 — Fabric.js Edit Layer (interactive):
- Fabric.Canvas overlaid exactly on top at same pixel dimensions
- Transparent background
- All editing operations happen here
- z-index 10

FLATTEN JOB (BullMQ worker):
When user clicks "Apply & Download":
1. Serialize Fabric.js objects: canvas.toJSON()
2. POST fabricJSON + original PDF blob key to API
3. Worker downloads original PDF from Azure
4. Worker maps Fabric.js coordinates to PDF coordinates
5. Worker draws each annotation onto pdf-lib page
6. Upload flattened PDF to Azure, return download URL

EDITING TOOLS (9 tools, left sidebar):
1. SELECT — multi-select with Shift+click, move with arrow keys (1px, Shift=10px), Delete key
2. TEXT — Fabric.IText, fonts: Inter/Instrument Serif/Courier New/Arial/Georgia, bold/italic/color/alignment toolbar
3. HIGHLIGHT — Fabric.Rect with opacity 0.4, color picker (yellow/green/pink/blue/orange)
4. RECTANGLE / ELLIPSE — fill none default, stroke color/width toolbar
5. LINE/ARROW — Fabric.Line + optional Fabric.Triangle arrowhead
6. FREEHAND DRAW — Fabric.PencilBrush, isDrawingMode = true, configurable width/color
7. IMAGE INSERT — file input, Fabric.Image with aspect-ratio lock handles
8. REDACT — Fabric.Rect fill #000000, permanent, warning dialog before applying
9. SIGNATURE INSERT — reuse E-signature component, insert as Fabric.Image

UNDO/REDO (custom command stack, NOT browser history):
interface Command { execute(): void; undo(): void }
class AddObjectCommand, ModifyObjectCommand, DeleteObjectCommand, MoveObjectCommand
Max 50 states. Keyboard: Ctrl+Z undo, Ctrl+Y redo, Ctrl+A select all, Ctrl+C/V copy/paste, Ctrl+D duplicate

COORDINATE MAPPING (server flatten job — CRITICAL):
const FABRIC_SCALE = 2 // retina render scale
const scaleX = pdfW / (canvasWidth / FABRIC_SCALE)
const scaleY = pdfH / (canvasHeight / FABRIC_SCALE)
// Fabric: top-left origin → PDF: bottom-left origin
const pdfX = (obj.left / FABRIC_SCALE) * scaleX
const pdfY = pdfH - ((obj.top / FABRIC_SCALE) * scaleY) - (obj.height * scaleY * obj.scaleY)

PAGE MANAGEMENT PANEL (right sidebar, 160px):
- Page thumbnails (PDF.js at 0.2 scale, 120px wide)
- Drag-to-reorder → update pageOrder[] → on flatten use pdfDoc.copyPages() in new order
- Right-click context menu: Delete page | Duplicate page | Rotate 90° CW | Rotate 90° CCW
- "Add blank page" button (pdf-lib A4 blank)
- Page count badge per thumbnail

DATABASE SCHEMA:
pdf_sessions table: id, sessionId, clerkUserId, originalBlobKey, fabricStateJson (jsonb per page array), pageOrder (jsonb), status (editing/flattening/done/expired), flattenedBlobKey, jobId, expiresAt (2hrs), createdAt

Auto-save: canvas:modified event → debounce 2000ms → tRPC editor.saveState()

tRPC ROUTES:
editor.initSession — create session, upload PDF to Azure, return sessionId + SAS URL
editor.saveState — persist fabricStateJson (auto-save)
editor.loadSession — return PDF SAS URL + fabricStateJson for resume
editor.flatten — push BullMQ job, return jobId
editor.getJobStatus — poll flatten status
editor.getDownloadUrl — SAS URL for flattened PDF (1hr)

FRONTEND LAYOUT:
Top bar: Logo | "Edit PDF" | [Undo] [Redo] | Zoom dropdown | [Apply & Download] (black pill)
Left sidebar (56px): 9 tool icons (Tabler icons, outline only)
Canvas (flex-1): virtualized with IntersectionObserver — only render ±1 page from viewport
Right sidebar (160px): page thumbnails with react-beautiful-dnd drag reorder
Properties panel (bottom, context-aware): text properties OR shape properties based on selection

ZOOM:
Options: 50%, 75%, 100%, 125%, 150%, Fit Width
Implementation: CSS transform: scale() on container (NOT Fabric zoom)
Keyboard: Ctrl+= zoom in, Ctrl+- zoom out, Ctrl+0 fit

PERFORMANCE (100+ page PDFs):
- Virtualized: render only pages within ±1 viewport of scroll (IntersectionObserver)
- Destroy Fabric canvas for pages >3 away — serialize state first
- Thumbnails: 0.2 scale render, update on modification
- Concurrent PDF.js rendering: max 2 pages at once

TESTING CHECKLIST:
[ ] Text click position matches PDF output position
[ ] Highlight covers correct text area after coordinate transform
[ ] Undo/redo 10 ops without corruption
[ ] Page reorder → correct output order
[ ] Redacted content permanently hidden
[ ] 50-page PDF — no browser crash, virtualization works
[ ] Auto-save fires, session resumes correctly

Implement ALL of the above completely. No placeholder comments. Real working TypeScript, no 'any' types, Zod validation on every tRPC input, proper error handling throughout.










You are a senior full-stack engineer. Build a production-grade Image Compression tool for PDFvault. Handle bulk compression of up to 100 images with client-side preview and server-side Sharp.js processing.

MONOREPO: Turborepo + pnpm
FRONTEND: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
  Client-side preview: browser-image-compression npm library
  File upload: react-dropzone
  Bulk download: JSZip (client), archiver npm (server)
API: Express + tRPC v11
AUTH: Clerk (optional — works anonymously)
STORAGE: Azure Blob Storage with 2hr lifecycle auto-delete
QUEUE: BullMQ + Redis for batch jobs
DATABASE: PostgreSQL + Drizzle ORM (Neon)
SERVER: Sharp.js (libvips — fastest Node.js image processing)
DESIGN: white bg, black #000000, gray #6F6F6F, Instrument Serif + Inter, pill buttons

SUPPORTED FORMATS:
Input: JPEG, PNG, WebP, AVIF, TIFF, BMP, GIF (first frame), HEIC (heic-convert npm)
Output: JPEG, PNG, WebP, AVIF (user selects)

TWO-PHASE ARCHITECTURE:
Phase 1 — Client-side instant preview (< 1 second, no upload):
  import imageCompression from 'browser-image-compression'
  const preview = await imageCompression(file, {
    maxSizeMB, maxWidthOrHeight, useWebWorker: true,
    fileType: outputFormat, initialQuality: quality/100,
    onProgress: (p) => setProgress(p),
  })
  Show before/after size, reduction percentage
  Files < 2MB single: serve browser-compressed directly (instant, no server)

Phase 2 — Server-side Sharp.js final output:
  Files > 2MB OR batch > 5 files → upload to Azure → BullMQ → Sharp.js → ZIP download

SHARP.JS SETTINGS (apps/worker/processors/image-compress.processor.ts):
Quality presets: low (quality:40, effort:6), medium (quality:70), high (quality:85), lossless

Always strip EXIF: .withMetadata({ exif: {}, icc: false, iptc: false, xmp: false })

Resize (if maxWidth/maxHeight set):
  .resize(maxWidth, maxHeight, { fit:'inside', withoutEnlargement:true, kernel:'lanczos3' })

JPEG:  .jpeg({ quality, progressive:true, mozjpeg:true, trellisQuantisation:true, overshootDeringing:true })
PNG:   .png({ compressionLevel:9, palette: quality<60, quality, effort:10 })
WebP:  .webp({ quality, effort, smartSubsample:true, lossless, nearLossless: quality>90, alphaQuality:quality })
AVIF:  .avif({ quality, effort, lossless, chromaSubsampling:'4:2:0' })

HEIC SUPPORT (iPhone photos):
import heicConvert from 'heic-convert'
Detect HEIC by magic bytes (check 'ftyp' at offset 4)
Convert to JPEG first: heicConvert({ buffer, format:'JPEG', quality:1 })
Then apply Sharp.js compression as normal

UI COMPONENTS:
Upload zone: react-dropzone, max 100 files, 50MB/file, 500MB total batch
Settings panel:
  Format: [JPEG] [PNG] [WebP] [AVIF] pill toggles
  Quality slider: 1-40 "Low", 41-70 "Medium", 71-89 "High", 90-100 "Maximum"
  Resize toggle: max width + max height inputs, "Never upscaled" note
  Strip metadata toggle (default ON): "Removes GPS location, camera info"
  Lossless toggle (WebP/AVIF only): hides quality slider

Image grid (per card): thumbnail, filename (truncated 20 chars), original size, → preview size, reduction badge (-67% green/>20%, amber/10-20%, gray/<10%), remove button
Grid: 2 cols mobile, 3 tablet, 4 desktop — react-virtual for 100+ images

Comparison view toggle:
  Grid view (default) OR Split view (react-compare-slider)
  Split: drag divider, sizes shown both sides, zoom both sides together

Download:
  Single: "Download" per card
  Bulk < 10 files: JSZip client-side (instant)
  Bulk > 10 files: server ZIP via archiver → Azure → SAS URL
  Progress: "Compressing 23/47 images..." with cancel button

BATCH JOB (BullMQ):
1. Upload all files to Azure via SAS URLs (parallel, max 5 concurrent)
2. POST blobKeys[] + options → tRPC imageCompress.startBatch
3. Create parent batch record + N child image records in DB
4. Push N BullMQ jobs (concurrency 10)
5. Worker compresses each image independently
6. Client polls imageCompress.getBatchStatus({ batchId })
   Returns: { total, completed, failed, imageResults[] }
7. When all done: create ZIP with archiver, up load to Azure, return SAS URL

DATABASE SCHEMA:
compress_batches: id, sessionId, clerkUserId, totalImages, completedImages, failedImages, status (pending/processing/partial/done/failed), outputZipKey, options (jsonb), totalInputBytes, totalOutputBytes, createdAt, expiresAt (1hr)
compress_images: id, batchId, originalBlobKey, outputBlobKey, originalFilename, originalSizeBytes, outputSizeBytes, outputFormat, status (pending/processing/done/failed), errorMessage, processingMs, createdAt

tRPC ROUTES:
imageCompress.getSasUrls — batch presigned upload URLs (max 100)
imageCompress.startBatch — create batch, push BullMQ jobs, return batchId
imageCompress.getBatchStatus — real-time per-image progress
imageCompress.getDownloadUrl — single image SAS URL
imageCompress.getZipDownloadUrl — batch ZIP SAS URL (1hr)

ANALYTICS (store in DB):
Track: average compression ratio by format, processing time, popular formats
Display to user: "Saved 45.2 MB total", "Average reduction: 73%"

SEO PAGE (/compress-image):
Primary keyword: "compress image online free" (350K/mo)
Secondary: "reduce image file size" (200K/mo)
Long-tail: "compress jpeg without losing quality", "compress png", "webp converter"
HowTo structured data schema, 10 FAQ questions

TESTING CHECKLIST:
[ ] JPEG quality 70 produces < 60% of original size for photo
[ ] PNG palette mode smaller for simple graphics
[ ] WebP opens in Chrome, Firefox, Safari
[ ] AVIF opens in Chrome 85+
[ ] HEIC from iPhone 15 converts + compresses correctly
[ ] 100-image batch completes without timeout
[ ] ZIP contains all images with correct filenames
[ ] EXIF strip: no GPS data in output (verify with exiftool)
[ ] Client preview within 5% of server output
[ ] Azure lifecycle deletes files after 2 hours

Implement ALL of the above completely. Production TypeScript, no 'any', no placeholder functions. Include all Sharp.js imports, Zod schemas for every tRPC input, full error handling (corrupt image, zero-byte file, unsupported format, HEIC conversion failure).