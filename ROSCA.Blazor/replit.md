# صرفة (Money Saver)

A desktop-first web app for rotating savings groups (ROSCAs / susus / tandas). A small, trusted circle of friends or coworkers contributes a fixed amount each cycle, and one member receives the entire pot each round, rotating until everyone has had a turn. Branded as "صرفة" with a green-box mascot; UI is Arabic RTL.

## Stack

- **Monorepo:** pnpm workspaces.
- **Frontend:** React + Vite + TypeScript, wouter for routing, TanStack Query, Framer Motion, shadcn-style UI components, Tailwind CSS, Sonner toasts.
- **Backend:** Express 5 + Drizzle ORM + Zod validation. OpenAPI-first with codegen for both client (orval) and zod schemas.
- **Database:** PostgreSQL (Replit-managed).
- **Auth:** Replit Auth (OIDC + PKCE) — single login flow covers both sign in and sign up.

## Artifacts

- `artifacts/money-saver` — the React+Vite frontend (path `/`).
- `artifacts/api-server` — the Express API server, mounted under `/api`.
- `artifacts/mockup-sandbox` — design sandbox (untouched, pre-existing).

## Domain model

- **Users** — extended with fullName, username, nationalId, bankAccount, onboardingComplete.
- **Currencies** — seeded with USD, EUR, GBP, JPY, CAD, AUD, MXN, BRL, INR, NGN, GHS, KES, ZAR, PHP.
- **Funds** — savings groups; status `pending` (معلقة) → `active` (نشط) → `completed` (مكتمل); periodType weekly/biweekly/monthly.
- **FundMembers** — join table; admin selects all members and their payoutOrder at fund creation. The admin can place themselves at any position in the order (no admin pinning). The roster is locked after creation regardless of status; no add/remove/reorder afterwards.
- **Payouts** — one per round; status `upcoming`/`collecting`/`paid`/`overdue`. Recipients and order are fixed at fund creation. The `upcoming → collecting` transition only fires once the fund's `startDate` has been reached (date-only comparison, ignores time).
- **Wallets** — one per fund, tracks running balance.
- **WalletTransactions** — `contribution` and `payout` events.

## Key product rules

- A user **cannot** send money directly to another member. The only payment surfaces are:
  - **Pay my share** on a payout where the user is *not* the recipient.
  - **Collect pot** on a payout where the user *is* the recipient and at least all other members have contributed.
- Funds auto-start based on `startDate`. The admin chooses every member and their payout order in the create-fund form; `POST /api/funds` requires `memberUserIds: string[]` (admin must be in the list, position is free). The schedule is generated immediately. If `startDate <= today`, the fund is created with status `active`; otherwise it is created `pending` (معلقة) and is automatically promoted to `active` (نشط) the first time a member views it on or after `startDate` (via `autoCollectDuePayouts`).
- Members and their payout order are immutable after creation. The legacy `add-member` / `reorder-members` endpoints now return HTTP 410 with `MEMBERS_LOCKED` and there is no admin UI for them.
- No collection happens before `startDate`: contribute/collect buttons are gated on `fund.status === "active" && startReached`, and payouts cannot transition `upcoming → collecting` until the start date is reached.
- Contribution and collection are gated on `fund.startDate`. Until that date, payouts stay `upcoming`, the schedule shows a "لم يبدأ التحصيل بعد" notice, and per-payout pay/collect buttons are hidden.
- **Auto-collect on overdue:** when a payout's due date passes, the system processes the transfer automatically on the next read of `/funds/:fundId/payouts` (or the wallet routes), even if not all members have contributed and even if the wallet balance is 0. The `payout` row is still inserted into `walletTransactions` and the wallet balance is clamped at 0. Before the due date, the original rule still applies (everyone except the recipient must contribute first).
- A "Person info" drawer shows public info for any member; member names are clickable everywhere they appear.

## Onboarding

A 4-step guided flow that uses the green box mascot as a character. Each step shows the mascot with a speech bubble. Step 3 collects KYC (full name, username, national ID, bank account). The final step calls `POST /api/profile/onboarding-complete` and redirects to the dashboard.

## Auth flow

- Public landing at `/` with login/get-started buttons.
- `/onboarding` — gated; redirects to dashboard if already complete.
- `/app/*` — gated; redirects to onboarding if profile incomplete; redirects to landing if not authenticated.
- Logout is wired to `useAuth().logout()` from `@workspace/replit-auth-web`.

## API surface

All under `/api` (mounted by api-server `routes/index.ts`):

- `GET /api/healthz`
- Auth (Replit Auth + mobile token exchange).
- `GET/PUT /api/profile`, `POST /api/profile/onboarding-complete`.
- `GET /api/users/:userId` — public info.
- `GET /api/currencies`.
- `GET /api/funds` (mine), `GET /api/funds/discover`, `POST /api/funds`, `GET /api/funds/:fundId`, `POST /api/funds/:fundId/start|join|leave`, `GET /api/funds/:fundId/members`.
- `GET /api/funds/:fundId/payouts`, `POST /api/payouts/:payoutId/contribute|collect`.
- `GET /api/funds/:fundId/wallet`, `GET /api/funds/:fundId/wallet/transactions`.
- `GET /api/dashboard/summary`, `GET /api/dashboard/activity`.

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all routes.
- `lib/db/src/schema/*` — Drizzle schemas. Run `pnpm --filter @workspace/db run push` to sync schema to the database.
- `lib/api-zod/src/generated/*`, `lib/api-client-react/src/generated/*` — codegen output (regenerate with `pnpm --filter @workspace/api-spec run codegen`).
- `artifacts/money-saver/src/components/{Mascot,SpeechBubble,PersonInfoDrawer}.tsx` — reusable building blocks.
- `artifacts/money-saver/src/pages/*` — one file per route.
- `artifacts/money-saver/src/index.css` — green/orange palette derived from the mascot.

## Common tasks

- **Add an API route:** edit `lib/api-spec/openapi.yaml`, run codegen, then add a handler in `artifacts/api-server/src/routes/`.
- **Reset the database** (destructive): use the database management tooling.
- **Restart workflows:** `artifacts/api-server: API Server` and `artifacts/money-saver: web`.
- **Seed demo data:** `pnpm --filter @workspace/db run seed` — wipes any prior `seed-*` rows, then inserts 12 demo users, 7 funds (mix of pending/active/completed), members, payouts, wallets, and transactions. Idempotent: safe to re-run. **All seeded users share the password `password123`** (e.g. login as `layla.h`, `omar.es`, `fatima.k`, `yousef.a`).

## Domain language

- The user-facing term for a savings group is **صندوق / صناديق** (singular/plural). Avoid the word "مجموعة" — that's the older label.
- "نقاط النزاهة" (Integrity Points) is the headline metric on the dashboard, computed from the user's payment history (on-time vs late vs missing) by `GET /api/me/integrity` and `GET /api/users/:userId/integrity`. Profile levels: ممتاز (≥90), جيد (≥75), متوسط (≥55), ضعيف (≥30), خطر (else).
- Membership is **admin-only**: there is no public discovery or self-join. Members are picked by username during fund creation only (`GET /api/users/search?q=…`); the roster is locked at creation regardless of fund status.
- Payouts auto-collect: when a payout's `dueDate` passes and every contributor has paid, the next read of `GET /api/funds/:fundId` lazily transitions the round to `paid` and credits the recipient. Members can only `contribute` while the payout's status is `collecting`.
- Payment status labels in the UI: **مدفوع** (the viewer has paid this round), **تم الاستلام** (recipient collected), **معلّق** (upcoming/not yet collecting).
- Registration is local-only: `fullName + username + password + nationalId + bankAccount` (no email field). `onboardingComplete` is set to `true` at registration; the post-register tour has no KYC step.

## Favicon / branding

The site icon is the green box mascot at `artifacts/money-saver/public/favicon.png` (mirrored from `src/assets/mascot.png`). Wired in `artifacts/money-saver/index.html` via `<link rel="icon">` and `<link rel="apple-touch-icon">`.
