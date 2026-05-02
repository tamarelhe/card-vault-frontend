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

---

## Web Design System

Design reference files are in `apps/web/design/` (`palette.png`, `search_page.png`).

### Color Palette

| Token | Hex | Tailwind class | Usage |
|---|---|---|---|
| Primary | `#8B5CF6` | `text-primary`, `bg-primary` | CTAs, active states, links |
| Primary Light | `#A78BFA` | `text-primary-light` | Hover on dark backgrounds |
| Primary Dark | `#7C3AED` | `bg-primary-dark` | Button hover state |
| Secondary | `#10B981` | `text-secondary`, `bg-secondary` | Success, uncommon rarity, positive deltas |
| Tertiary | `#B06B00` | `text-tertiary` | Warnings, orange accents |
| Tertiary Light | `#D97706` | `text-tertiary-light` | Mythic rarity label |
| Neutral | `#7A7580` | `text-cv-neutral` | Muted text, placeholders, inactive icons |
| Surface Deep | `#0F0F18` | `bg-cv-deep` | Page background, sidebar background |
| Surface Base | `#131320` | `bg-cv-base` | Top app bar |
| Surface Raised | `#1A1A28` | `bg-cv-raised` | Panels, forms, cards |
| Surface | `#1E1E2E` | `bg-cv-surface` | Inputs, card tiles |
| Surface Overlay | `#252535` | `bg-cv-overlay` | Hover states on panels |
| Border | `#2A2A3D` | `border-cv-border` | All borders and dividers |

All tokens are defined in `apps/web/tailwind.config.ts` under `theme.extend.colors`.

### Typography

| Role | Font | Tailwind class |
|---|---|---|
| Headlines / section titles | Noto Serif | `font-serif` |
| Body / UI / labels | Inter | `font-sans` (default) |

Fonts are loaded via Google Fonts `@import` at the top of `apps/web/app/globals.css`.

### Layout — AppShell

The authenticated shell (`AppShell`) has two layers:

1. **Top bar** (`h-11`, `bg-cv-base`) — full-width header containing:
   - Logo `Card|Vault` (white + primary) — fixed `w-48`
   - Horizontal nav tabs — active tab uses `text-primary`, inactive `text-cv-neutral`
   - Right actions: bell icon, settings icon, user avatar circle (`bg-primary/20 text-primary`)

2. **Sidebar** (`w-48`, `bg-cv-deep`) — left panel below the top bar:
   - Section heading `The Vault` in `font-serif text-base font-bold text-white`
   - Subtitle `ENTIRE ARCHIVE` in `text-[10px] uppercase tracking-widest text-cv-neutral`
   - Nav items: icon + label, active = `bg-primary/10 text-primary`, inactive = `text-cv-neutral hover:bg-cv-raised hover:text-white`
   - Bottom: email + sign-out button

### Components

#### Inputs & Selects (dark theme)
```
border border-cv-border bg-cv-surface text-white placeholder:text-cv-neutral
focus:border-primary/60 focus:ring-1 focus:ring-primary/30
```

#### Primary button
```
bg-primary text-white hover:bg-primary-dark
```

#### Ghost / outline button
```
border border-cv-border text-cv-neutral hover:border-white/20 hover:text-white
```

#### Filter panel (Search page)
Two-row layout. Each field has a label above it in `text-[11px] font-medium uppercase tracking-wide text-cv-neutral`. The panel uses `bg-cv-raised border border-cv-border rounded-xl`.

#### Card tiles (Search grid)
```
bg-cv-surface border border-cv-border rounded-xl
hover:border-primary/40 hover:bg-cv-overlay
```
Inside: portrait image (`aspect-[2/3]`), card name in `text-white`, set code in `text-cv-neutral`, rarity with colour coding.

#### Rarity colours
| Rarity | Class |
|---|---|
| common | `text-slate-400` |
| uncommon | `text-secondary` |
| rare | `text-yellow-400` |
| mythic | `text-tertiary-light` |
| special | `text-primary-light` |
| bonus | `text-pink-400` |

#### Pagination
Page number buttons use `border border-cv-border text-cv-neutral`; active page uses `bg-primary text-white`.

### Error / Status states
- Error banner: `border border-red-900/50 bg-red-950/40 text-red-400`
- Loading spinner: `text-primary animate-spin`
- Empty state: centered icon in `text-cv-border`, primary text `text-white`, secondary text `text-cv-neutral`
