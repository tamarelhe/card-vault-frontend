# CardVault Frontend

Monorepo for the CardVault trading card collection app — mobile (Expo/React Native) + web (Next.js) + shared packages.

## Stack

| Layer | Technology |
|---|---|
| Package manager | pnpm |
| Monorepo | Turborepo |
| Mobile | Expo + React Native + Expo Router |
| Web | Next.js 15 App Router |
| Language | TypeScript (strict) |
| Data fetching | TanStack Query |
| Forms | React Hook Form + Zod |
| Mobile styling | React Native StyleSheet (NativeWind later) |
| Web styling | Tailwind CSS |
| Mobile storage | expo-secure-store |
| Scan (mobile) | VisionCamera + ML Kit OCR |

## Architecture Rules

**Do not make one identical UI for mobile and web.**

### Share across platforms (in `packages/`)

- API client (`@cardvault/api`)
- TypeScript types (`@cardvault/core`)
- Zod schemas (`@cardvault/validation`)
- Formatters, game/condition constants
- Scan parsing logic
- Business helpers and domain logic

### Keep separate per platform (in `apps/`)

- Screens / pages
- Navigation
- Camera implementation
- Mobile-specific UX patterns
- Web dashboards and analytics
- Platform-specific storage

## Shared Package Responsibilities

### `@cardvault/core`
Domain types, game/condition constants, price formatters, scan-parser helpers, utility functions.

### `@cardvault/api`
Typed HTTP client for the Go backend. Auth, cards, collections, scan resolve, price, watchlist endpoints.
The scan resolve endpoint is `POST /api/v1/scan/resolve` — backend returns `exact`, `multiple_candidates`, or `not_found`.

### `@cardvault/validation`
Shared Zod schemas used by both apps. Login/register, collection items, scan requests.

### `@cardvault/config`
Shared `tsconfig` and ESLint configs.

## Scan Flow (Mobile Only)

Real-time camera scan — not photo capture.

1. Open scan screen → request camera permission
2. Start camera preview
3. Process frames at controlled interval (**one frame every 300–500ms**, no parallel OCR jobs)
4. Run OCR locally, parse text into `ParsedScanHints`
5. Wait for **stable hints across 2–3 readings** before resolving
6. Call `POST /scan/resolve`
7. Show exact match / candidate list / not-found
8. User confirms → add card to collection

**Stop scanning while a backend request is in flight. Resume if result is rejected.**

Scan states:
```
idle → requesting_permission → camera_ready → scanning
→ processing_frame → resolving → exact_match | multiple_candidates | not_found | error
```

Scan UX must always include a **manual search fallback**.

## Web vs Mobile Responsibilities

| Feature | Mobile | Web |
|---|---|---|
| Real-time card scan | Yes | No |
| Collection management | Yes | Yes |
| Analytics & price history | No | Yes |
| Watchlists & alerts | Basic | Full |
| Shared/public collections | No | Yes |
| Set completion view | No | Yes |

## Authentication

- Auth logic lives in `@cardvault/api` (shared)
- Mobile token storage: `expo-secure-store`
- Web token storage: in-memory + `localStorage` (httpOnly cookies later)
- JWT bearer token on all authenticated requests
- Redirect to login on 401

## Data Fetching

Use TanStack Query in both apps. Query keys are defined in `@cardvault/api/src/query-keys.ts`.
Always invalidate relevant queries after mutations (add/edit/remove card).
Always handle loading, empty, and error states explicitly.

## Coding Standards

- TypeScript strict mode — no `any` without justification
- Feature-based folder structure inside `apps/*/src/features/`
- Business logic in packages, platform UI in apps
- Small, composable hooks
- English for all code, comments, and names
- No comments unless the WHY is non-obvious

## Environment Variables

| Context | Variable |
|---|---|
| Root | `CARDVAULT_API_URL` |
| Mobile | `EXPO_PUBLIC_CARDVAULT_API_URL` |
| Web | `NEXT_PUBLIC_CARDVAULT_API_URL` |

Android emulator needs `10.0.2.2` instead of `localhost`. Physical devices need LAN IP or a tunnel.

## Implementation Order (Milestones)

1. Monorepo foundation (this milestone)
2. Shared API client
3. Auth UI (mobile + web)
4. Collection MVP (mobile + web)
5. Mobile real-time scan MVP
6. Web dashboard
7. Watchlist and price alerts
8. Sharing and set completion

**First vertical slice for scan:** camera preview → fake OCR text → parse hints → call backend → show candidates → add to collection. Replace fake OCR with real frame OCR only after the full flow works end-to-end.

## Common Commands

```bash
pnpm install          # install all dependencies
pnpm dev              # start mobile + web concurrently
pnpm build            # build all packages and apps
pnpm lint             # lint all
pnpm typecheck        # type-check all
```
