# ConvertAnything — Project Documentation

> PDF Tools Platform | iLovePDF Competitor | Scalable to 100K+ Users

## Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | Next.js 15 + TypeScript | App Router, SSG for SEO, ISR |
| API | tRPC v11 + Express | Type-safe, no REST boilerplate |
| Monorepo | Turborepo | Fast builds, shared packages |
| ORM | Drizzle ORM | Lightweight, type-safe, fast |
| Database | PostgreSQL (Neon) | Free tier, serverless, scalable |
| Cache + Queue | Redis (Upstash) | Serverless Redis, BullMQ queue |
| File Storage | Cloudflare R2 | Zero egress cost |
| Workers | Node.js + BullMQ | PDF processing jobs |
| PDF Engine | pdf-lib + Ghostscript + LibreOffice | Open source, powerful |
| Styling | Tailwind CSS v4 + shadcn/ui | Fast, consistent UI |
| Auth | Clerk | Free tier, anonymous-first |
| Deploy | Vercel (FE) + Railway/Hetzner (API+Worker) | Cost effective |

## Architecture

```
User Browser
    │
    ├── Next.js (Vercel) ──── tRPC Client
    │                              │
    │                     Express API Server
    │                     ├── tRPC Router
    │                     ├── Clerk Auth
    │                     └── Rate Limiter
    │                              │
    │                     BullMQ Job Queue (Redis)
    │                              │
    │                     Worker Pods
    │                     ├── Merge/Split (pdf-lib)
    │                     ├── Compress (Ghostscript)
    │                     ├── PDF↔Office (LibreOffice)
    │                     ├── PDF↔Image (Sharp/Poppler)
    │                     └── Edit/Watermark (pdf-lib)
    │                              │
    ├── Cloudflare R2 (Files) ─────┘
    ├── PostgreSQL/Neon (Data)
    └── Redis/Upstash (Queue + Cache)
```

## Auth Strategy

**Anonymous-First + Clerk Upgrade**
- All users get a `ca_session` UUID cookie on first visit
- Operations work without login (sessionId-based tracking)
- Clerk auth adds: job history, higher limits, batch processing
- On sign-up: webhook migrates sessionId data → userId

## File Structure

```
convertAnything/
├── apps/
│   ├── web/                          # Next.js Frontend
│   │   ├── app/
│   │   │   ├── (marketing)/          # Landing page
│   │   │   │   ├── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── (tools)/              # PDF tool pages
│   │   │   │   ├── merge-pdf/page.tsx
│   │   │   │   ├── split-pdf/page.tsx
│   │   │   │   ├── compress-pdf/page.tsx
│   │   │   │   ├── pdf-to-jpg/page.tsx
│   │   │   │   ├── pdf-to-word/page.tsx
│   │   │   │   ├── word-to-pdf/page.tsx
│   │   │   │   ├── jpg-to-pdf/page.tsx
│   │   │   │   ├── rotate-pdf/page.tsx
│   │   │   │   ├── watermark-pdf/page.tsx
│   │   │   │   ├── unlock-pdf/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   ├── sign-up/[[...sign-up]]/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── api/webhooks/clerk/route.ts
│   │   │   ├── sitemap.ts
│   │   │   ├── robots.ts
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn components
│   │   │   ├── layout/
│   │   │   │   ├── header.tsx
│   │   │   │   └── footer.tsx
│   │   │   ├── tools/
│   │   │   │   ├── file-uploader.tsx
│   │   │   │   ├── progress-tracker.tsx
│   │   │   │   ├── download-button.tsx
│   │   │   │   └── tool-card.tsx
│   │   │   └── marketing/
│   │   │       ├── hero.tsx
│   │   │       ├── tool-grid.tsx
│   │   │       └── features.tsx
│   │   ├── lib/
│   │   │   ├── utils.ts
│   │   │   └── seo.ts
│   │   ├── middleware.ts
│   │   ├── trpc/
│   │   ├── providers/
│   │   └── package.json
│   │
│   ├── api/                          # Express + tRPC API
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── server.ts
│   │   │   └── env.ts
│   │   └── package.json
│   │
│   └── worker/                       # BullMQ Worker
│       ├── src/
│       │   ├── index.ts
│       │   ├── queue.ts
│       │   ├── worker.ts
│       │   └── processors/
│       │       ├── merge.processor.ts
│       │       ├── split.processor.ts
│       │       ├── compress.processor.ts
│       │       ├── pdf-to-image.processor.ts
│       │       ├── pdf-to-word.processor.ts
│       │       ├── image-to-pdf.processor.ts
│       │       ├── rotate.processor.ts
│       │       ├── watermark.processor.ts
│       │       ├── unlock.processor.ts
│       │       └── word-to-pdf.processor.ts
│       └── package.json
│
├── packages/
│   ├── database/                     # Drizzle schema + migrations
│   │   ├── models/
│   │   │   ├── user.ts
│   │   │   ├── job.ts
│   │   │   ├── file.ts
│   │   │   └── rate-limit.ts
│   │   ├── schema.ts
│   │   ├── index.ts
│   │   └── drizzle.config.ts
│   │
│   ├── pdf-core/                     # PDF processing logic
│   │   └── src/
│   │       ├── index.ts
│   │       ├── merge.ts
│   │       ├── split.ts
│   │       ├── compress.ts
│   │       ├── rotate.ts
│   │       ├── watermark.ts
│   │       ├── pdf-to-image.ts
│   │       ├── image-to-pdf.ts
│   │       ├── validate.ts
│   │       └── types.ts
│   │
│   ├── storage/                      # R2/local file storage
│   │   └── src/
│   │       ├── index.ts
│   │       ├── r2.ts
│   │       ├── local.ts
│   │       └── presigned.ts
│   │
│   ├── queue/                        # BullMQ shared queue
│   │   └── src/
│   │       ├── index.ts
│   │       ├── connection.ts
│   │       ├── pdf-queue.ts
│   │       └── types.ts
│   │
│   ├── validators/                   # Shared Zod schemas
│   │   └── src/
│   │       ├── index.ts
│   │       ├── upload.ts
│   │       ├── job.ts
│   │       └── tool-options.ts
│   │
│   ├── trpc/                         # tRPC server + client
│   │   ├── server/
│   │   │   ├── index.ts
│   │   │   ├── trpc.ts
│   │   │   ├── context.ts
│   │   │   ├── routes/
│   │   │   │   ├── health/route.ts
│   │   │   │   ├── upload/route.ts
│   │   │   │   ├── job/route.ts
│   │   │   │   └── user/route.ts
│   │   │   └── middleware/
│   │   │       ├── auth.ts
│   │   │       └── rate-limit.ts
│   │   └── client/
│   │
│   ├── services/                     # Business logic
│   │   ├── user/
│   │   ├── job/
│   │   └── upload/
│   │
│   ├── logger/                       # Winston logger
│   ├── eslint-config/
│   └── typescript-config/
│
├── agent.md                          # This file
├── turbo.json
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── .env.example

```

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...          # Neon (prod) or local Docker (dev)

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# Redis (Upstash)
REDIS_URL=rediss://...

# Cloudflare R2
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=convertanything

# API
PORT=8000
NODE_ENV=development
BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000/trpc
```

## Development Commands

```bash
pnpm install              # Install all dependencies
pnpm dev                  # Start all services (web, api, worker)
pnpm build                # Build all packages
pnpm db:generate          # Generate Drizzle migrations
pnpm db:migrate           # Run migrations
pnpm db:studio            # Open Drizzle Studio
pnpm lint                 # Lint all packages
pnpm check-types          # TypeScript check
```

## Rate Limits

| User Type | Uploads/hr | Ops/hr | Max File Size |
|-----------|-----------|--------|---------------|
| Anonymous | 10 | 20 | 10 MB |
| Free (Clerk) | 50 | 100 | 50 MB |
| Premium | 100 | 200 | 100 MB |

## PDF Tools & Libraries

| # | Tool | Library | Difficulty |
|---|------|---------|-----------|
| 1 | Merge PDF | pdf-lib | Easy |
| 2 | Split PDF | pdf-lib | Easy |
| 3 | Rotate PDF | pdf-lib | Easy |
| 4 | Watermark PDF | pdf-lib | Easy |
| 5 | JPG to PDF | sharp + pdf-lib | Easy |
| 6 | Compress PDF | Ghostscript CLI | Medium |
| 7 | PDF to JPG | Poppler CLI | Medium |
| 8 | Unlock PDF | qpdf CLI | Medium |
| 9 | PDF to Word | LibreOffice CLI | Hard |
| 10 | Word to PDF | LibreOffice CLI | Hard |

## Job Flow

```
User Upload → API validates → Presigned URL → Direct to R2 →
Confirm upload → Job created in DB → Push to BullMQ →
Worker picks up → Process PDF → Upload result to R2 →
Update job status → Poll from frontend → Download (signed URL, 1hr expiry)
```

---

*Last updated: 2026-05-29*
