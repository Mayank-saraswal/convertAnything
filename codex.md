# Codex Context

Last reviewed: 2026-05-29

## Project Snapshot

This repository is a pnpm/Turbo TypeScript monorepo. The checked-in README files are still mostly starter-template text and do not accurately describe the current app.

The actual product name used in code is `Streamyst`, although the repository folder is `convertAnything`.

## Workspace Layout

- `apps/api`: Express API server. Exposes tRPC at `/trpc`, OpenAPI-compatible routes at `/api`, Scalar docs at `/docs`, and OpenAPI JSON at `/openapi.json`.
- `apps/web`: Next.js app router frontend. Uses React 19, Next 16, Tailwind CSS 4, shadcn/Radix UI components, TanStack Query, and tRPC React.
- `packages/trpc`: Shared tRPC router, procedures, OpenAPI metadata, client exports, and route definitions.
- `packages/services`: Service layer. Currently has user authentication-provider discovery and Google OAuth client setup.
- `packages/database`: Drizzle ORM setup for Postgres plus the `users` schema and initial migration.
- `packages/logger`: Shared Winston logger with environment-based formatting and level.
- `packages/eslint-config`: Shared flat ESLint configs for base, Next, and React.
- `packages/typescript-config`: Shared TypeScript configs for base, Next, and Node.

## Important Files

- Root commands and workspace config:
  - `package.json`
  - `pnpm-workspace.yaml`
  - `turbo.json`
  - `prettier.config.js`
  - `docker-compose.yml`
- API:
  - `apps/api/src/index.ts`: creates and starts the HTTP server.
  - `apps/api/src/server.ts`: configures Express middleware, docs, health routes, tRPC, and OpenAPI routes.
  - `apps/api/src/env.ts`: validates `PORT`, `NODE_ENV`, and `BASE_URL`.
- Web:
  - `apps/web/app/page.tsx`: server component that calls `api.health.getHealth.query()` and renders server status.
  - `apps/web/app/layout.tsx`: global layout, local Geist fonts, dark root class, global providers.
  - `apps/web/providers/global.tsx`: React Query, next-themes, tRPC provider, and Sonner toaster.
  - `apps/web/trpc/create-client.ts`: tRPC link factory using `NEXT_PUBLIC_API_URL` or `"/trpc"`.
  - `apps/web/components/ui/*`: shadcn UI primitives; mostly generated reusable UI code.
- tRPC:
  - `packages/trpc/server/index.ts`: composes `health` and `auth` routers.
  - `packages/trpc/server/routes/health/route.ts`: `health.getHealth`, OpenAPI GET `/health`, returns `{ status: "healthy" }`.
  - `packages/trpc/server/routes/auth/route.ts`: `auth.getSupportedAuthenticationProviders`, OpenAPI GET `/authentication/supported-providers`.
  - `packages/trpc/client/index.ts`: exports router types and `@trpc/client`.
- Services:
  - `packages/services/user/index.ts`: returns supported auth methods. Google OAuth is included only when Google OAuth env vars exist.
  - `packages/services/user/model.ts`: Zod output model for auth provider metadata.
  - `packages/services/clients/google-oauth.ts`: Google `OAuth2Client`.
- Database:
  - `packages/database/schema.ts`: exports database models.
  - `packages/database/models/user.ts`: `users` table.
  - `packages/database/drizzle/0000_dusty_morg.sql`: initial user table migration.

## Commands

Use pnpm from the repository root.

- Install dependencies: `pnpm install`
- Run all dev tasks: `pnpm dev`
- Build all packages/apps: `pnpm build`
- Lint: `pnpm lint`
- Typecheck: `pnpm check-types`
- Format TypeScript/TSX/Markdown: `pnpm format`
- Generate Drizzle migrations: `pnpm db:generate`
- Run Drizzle migrations: `pnpm db:migrate`
- Start Postgres: `docker compose up -d`

Package-level commands:

- API dev server: `pnpm --filter @repo/api dev`
- API build: `pnpm --filter @repo/api build`
- Web dev server: `pnpm --filter web dev`
- Web build: `pnpm --filter web build`

## Environment Variables

Root scripts use `dotenv -- turbo ...`, so a root `.env` is expected for local development.

Required by database package:

- `DATABASE_URL`

Required by services package:

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`

API variables:

- `PORT`, optional, defaults to `8000`.
- `NODE_ENV`, optional, accepted values are `development` or `prod`, defaults to `development`.
- `BASE_URL`, optional, defaults to `http://localhost:8000`.

Web variables:

- `NEXT_PUBLIC_API_URL`, optional. When absent, web tRPC clients call `"/trpc"`.

Logger variables:

- `LOGGER_LEVEL`, optional, accepted values are `error`, `debug`, or `info`.
- `NODE_ENV`, optional, accepted values are `development` or `prod`.

## Runtime Behavior

- The API server listens on `PORT` or `8000`.
- API CORS is permissive only when `NODE_ENV !== "prod"`.
- API root route returns `{ message: "Streamyst is up and running..." }`.
- API `/health` returns `{ message: "Streamyst server is healthy", healthy: true }`.
- tRPC `health.getHealth` returns `{ status: "healthy" }`.
- The web home page calls the tRPC health route from a server component and displays the result.
- OpenAPI route metadata is generated from the shared tRPC router with `trpc-to-openapi`.

## Database Schema

The initial migration creates a `users` table:

- `id`: UUID primary key, defaults to random UUID.
- `full_name`: varchar(80), required.
- `email`: varchar(255), required, unique.
- `email_verified`: boolean, defaults false.
- `profile_image_url`: text, optional.
- `created_at`: timestamp, defaults now.
- `updated_at`: timestamp, updated in Drizzle via `$onUpdate`.

## Conventions

- TypeScript is strict through shared configs.
- Prettier uses 2 spaces, semicolons, double quotes, trailing commas, and `printWidth: 100`.
- Web path alias is `~/*`.
- shadcn aliases are configured in `apps/web/components.json`.
- The frontend uses Tailwind CSS 4 via `@import "tailwindcss"` in `apps/web/app/globals.css`.
- UI icons should use `lucide-react`, consistent with shadcn config.
- Generated UI primitives live under `apps/web/components/ui`; prefer composing them rather than editing generated internals unless necessary.

## Notable Gaps And Gotchas

- Root `README.md` and `apps/web/README.md` are still starter docs.
- `setup.sh` references `.env.example`, but no `.env.example` is currently checked in.
- `setup.sh` uses `link .env "$target"`; on typical Unix shells this is likely intended to be `ln -s` or similar.
- Package `.eslintrc.cjs` files extend `@repo/eslint-config/node.js`, but `packages/eslint-config/package.json` does not export `./node.js`, and no `node.js` file exists in that package.
- `apps/api/tsup.config.ts` has `noExternal: ["@teachyst"]`, which does not match the repo package scope `@repo`.
- `packages/services/env.ts` requires Google OAuth variables at module import time. This means any route importing services can fail startup if those env vars are missing, even though `UserService` checks whether Google is configured later.
- `packages/trpc/server/trpc.ts` imports `TRPCError` but does not use it.
- `packages/services/user/index.ts` imports `db` and `usersTable` but does not use them yet.
- There are no test files in the current repository.

## File Inventory Notes

- `pnpm-lock.yaml` is present and should be treated as generated dependency lock state.
- Font binaries are checked in under `apps/web/app/fonts`.
- Public SVG starter assets are in `apps/web/public`.
- Drizzle snapshot metadata is checked in under `packages/database/drizzle/meta`.
