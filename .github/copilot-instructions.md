# Copilot instructions for IRMA-Verse

## Big picture architecture

- This is a Next.js App Router monolith (Next 16 + React 19) with UI pages in `app/*` and backend route handlers in `app/api/*/route.ts`.
- Real-time features are powered by Socket.IO on a custom Node server in `server.ts` (presence, chat, typing, forum room, notification push).
- Auth is NextAuth v5 (Auth.js) in `lib/auth.ts` with Credentials + Google providers; API handlers usually call `auth()` directly.
- Data access is Prisma/MySQL via `lib/prisma.ts`; schema is large and domain-driven (`material`, `programs`, `notifications`, `chat_*`, `friendships`, etc.) in `prisma/schema.prisma`.
- Client runtime providers are layered in `app/layout.tsx`: `SessionProvider` → `SocketProvider` → `ConfirmProvider` → `NotificationProvider`.

## Critical flows and integration points

- Notification flow is DB-first then socket push:
  1. create records via `lib/notifications.ts`,
  2. emit via `lib/socket-emit.ts`,
  3. server forwards through `/__internal/push-notification` in `server.ts`,
  4. client consumes in `lib/notification-provider.tsx`.
- Chat is hybrid REST + socket: persistence through `app/api/chat/**`, live events through `lib/socket.tsx` and `server.ts`.
- Route guarding is cookie-based in `proxy.ts` for page navigation; API routes enforce auth/role themselves.

## Project-specific conventions to follow

- Prisma model names are lowercase/plural (`users`, `material`, `materialinvite`), so route code uses `prisma.users`, `prisma.material`, etc. Keep this style.
- Many writes set `id` manually with `crypto.randomUUID()` because models do not always define DB defaults.
- Role values in DB are lowercase enums (`user`, `instruktur`, `admin`, `super_admin`). Preserve existing checks; some files still include legacy `"instructor"` handling.
- Most API responses use `NextResponse.json` with bilingual/Indonesian error messages; keep message tone and language consistent with nearby code.
- Several handlers intentionally use loose typing (`any`) around Prisma enums/relations for compatibility. Avoid broad refactors unless required by the task.
- Next.js 16 pattern is used in dynamic route handlers: `params` may be typed as `Promise<{ id: string }>` and awaited.

## Developer workflows

- Install deps: `pnpm install`
- Main dev mode (required for socket features): `pnpm dev` (runs `tsx server.ts`)
- Next-only dev (no custom socket server): `pnpm dev:next`
- Production build sanity check: `pnpm run build`
- Lint: `pnpm lint`
- Prisma: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:studio`
- Seed behavior: `prisma/seed.ts` truncates many tables; treat as destructive dev reset.

## Where to look first by feature

- Auth/session: `lib/auth.ts`, `types/next-auth.d.ts`, `app/api/auth/**`
- Materials/invitations: `app/api/materials/route.ts`, `app/api/materials/[id]/invite/route.ts`
- Notifications: `app/api/notifications/route.ts`, `lib/notifications.ts`, `lib/notification-provider.tsx`
- Realtime/chat/forum: `server.ts`, `lib/socket.tsx`, `app/api/chat/**`
- User-to-user chat (mutual): `app/friends/chat/page.tsx`, `app/api/chat/users/**`, `lib/user-chat.ts`
- Gamification: `lib/gamification.ts`, `app/api/users/gamification/route.ts`
- Uploads: `app/api/upload/route.ts` (stores files under `public/uploads`)

## Change strategy for AI agents

- Prefer minimal, localized edits in existing feature modules instead of cross-cutting rewrites.
- When adding a real-time feature, implement REST persistence first, then add socket event emission/consumption.
- Validate role gates in API handlers, not only in client pages.
