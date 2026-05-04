# Collection Sharing — Web Implementation Plan

## Overview

Implement the full collection sharing flow on the web app, covering all six API endpoints introduced in the backend spec. The feature has two roles: **owner** (manages the share link and member list) and **shared user** (joins via invite and can leave).

---

## Endpoints to implement

| Method | Path | Who |
|---|---|---|
| `POST` | `/api/v1/collections/{id}/share-links` | Owner — generate/regenerate token |
| `GET` | `/api/v1/share-links/{token}` | Anyone — preview before accepting |
| `POST` | `/api/v1/share-links/{token}` | Authenticated user — accept invite |
| `GET` | `/api/v1/collections/{id}/shares` | Owner — list members |
| `DELETE` | `/api/v1/collections/{id}/shares/{userID}` | Owner — revoke a member |
| `DELETE` | `/api/v1/collections/{id}/membership` | Shared user — leave |

---

## Step 1 — Core types (`packages/core/src/types/collection.ts`)

**Add to `Collection`:**
```ts
ownership: 'owned' | 'shared';
```

**Add new types:**
```ts
interface ShareInvite {
  token: string;
  collection_id: string;
  created_at: string;
}

interface SharedUser {
  user_id: string;
  email: string;
  joined_at: string;
}

interface SharedUsersResponse {
  users: SharedUser[];
}
```

Export all three from the package barrel (`packages/core/src/index.ts`).

---

## Step 2 — API client (`packages/api/src/collections.ts`)

Add six methods to the existing `createCollectionsApi` factory:

```ts
generateShareLink(collectionId: string): Promise<ShareInvite>
// POST /api/v1/collections/{id}/share-links

getSharePreview(token: string): Promise<Collection>
// GET /api/v1/share-links/{token}

acceptShareInvite(token: string): Promise<Collection>
// POST /api/v1/share-links/{token}

listSharedUsers(collectionId: string): Promise<SharedUsersResponse>
// GET /api/v1/collections/{id}/shares

revokeUserAccess(collectionId: string, userId: string): Promise<void>
// DELETE /api/v1/collections/{id}/shares/{userID}

leaveCollection(collectionId: string): Promise<void>
// DELETE /api/v1/collections/{id}/membership
```

---

## Step 3 — Query keys (`packages/api/src/query-keys.ts`)

```ts
sharePreview: (token: string) => ['share-preview', token] as const,
collectionShares: (id: string) => ['collection', id, 'shares'] as const,
```

`generateShareLink`, `acceptShareInvite`, `revokeUserAccess`, and `leaveCollection` are mutations — no query keys needed for them. `sharePreview` and `collectionShares` are queries.

---

## Step 4 — Accept invite page (`apps/web/app/accept-invite/[token]/page.tsx`)

New public-ish page (still requires auth — redirect to login if unauthenticated, then return here).

**Flow:**
1. On mount, `useQuery` calls `getSharePreview(token)` to show a confirmation screen.
2. User sees collection name, description, card count, and total value.
3. "Add to my collection" button triggers `acceptShareInvite(token)` mutation.
4. On success, invalidate `queryKeys.collections` and navigate to `/collections/{id}`.

**States to handle:**

| State | UI |
|---|---|
| Loading preview | Spinner centered |
| Preview loaded | Collection card + confirm button |
| Submitting | Button in loading state |
| `404` on GET (bad/expired token) | Error banner: "This invite link is invalid or has expired." |
| `422` on POST (owner accepting own) | Error banner: "You cannot accept your own invite." |
| Already a member (POST idempotent `200`) | Navigate to collection as normal |
| Unauthenticated | Redirect to `/login?next=/accept-invite/{token}` |

The page must be outside the `AppShell` authenticated guard — or at minimum handle the redirect-back-after-login pattern. Use the existing `next` query param pattern if auth redirect already supports it; otherwise note this as a prerequisite.

---

## Step 5 — Collections list page (`apps/web/app/collections/page.tsx`)

**Ownership badge:**
- Add a pill/badge to each collection card showing `Shared` (using `bg-primary/10 text-primary-light` tokens) when `collection.ownership === 'shared'`.
- Owned collections show no badge (or an optional `Mine` badge if the design calls for it).

**Leave vs Delete:**
- The existing delete action (trash icon / menu option) must be conditional:
  - `ownership === 'owned'` → delete collection (existing flow)
  - `ownership === 'shared'` → leave collection: call `leaveCollection(id)`, then invalidate `queryKeys.collections`
- Show a confirmation modal before leaving (mirrors the delete confirmation pattern).
- Leave action must not appear if the user is the owner.

---

## Step 6 — Collection detail page (`apps/web/app/collections/[id]/page.tsx`)

This page gets the most changes. Add a **sharing panel** visible only to owners when the collection is public.

### 6a — Share link section (owner + public collection)

Display near the collection header (alongside edit/delete actions).

**Share button behaviour:**
- If collection is `private`: show "Share" button disabled with tooltip "Make the collection public first to share it."
  - Alternatively: clicking it opens a prompt offering to make it public in one step.
- If collection is `public`: clicking "Share" opens a `ShareLinkModal`.

**`ShareLinkModal` content:**
1. On open, call `generateShareLink(id)` mutation to create/replace the token.
2. Show the full shareable URL: `{APP_BASE_URL}/accept-invite/{token}` in a read-only input.
3. "Copy link" button (clipboard API).
4. "Regenerate link" button — calls the mutation again, updates the displayed URL, shows a brief warning that the old link stops working.
5. Close button.

### 6b — Shared members list (owner only)

Below the card grid (or in a collapsible side panel), show a "Shared with" section.

**Query:** `useQuery({ queryKey: queryKeys.collectionShares(id), queryFn: () => collectionsApi.listSharedUsers(id), enabled: isOwner })`

**Content:**
- Heading "Shared with" + member count.
- Each row: user email, joined date, "Revoke" button.
- "Revoke" calls `revokeUserAccess(id, userId)`, then invalidates `collectionShares(id)`.
- Empty state: "No one has joined yet."

### 6c — Leave button (shared users only)

When `collection.ownership === 'shared'`, replace the owner-only actions (edit, delete, share) with a single "Leave collection" button.

- Clicking shows a confirmation modal: "Are you sure you want to leave this collection?"
- On confirm: call `leaveCollection(id)`, invalidate `queryKeys.collections`, navigate to `/collections`.

---

## Step 7 — Auth redirect for accept-invite (if not already supported)

Check `apps/web/src/context/AuthContext.tsx` and the login page for `next` param support.
- If login page already reads `?next=...` and redirects after success → no work needed.
- If not → add it: after login/register success, check `searchParams.get('next')` and `router.replace(next)`.

---

## Files changed / created

| File | Action |
|---|---|
| `packages/core/src/types/collection.ts` | Edit — add `ownership`, `ShareInvite`, `SharedUser`, `SharedUsersResponse` |
| `packages/core/src/index.ts` | Edit — export new types |
| `packages/api/src/collections.ts` | Edit — add 6 new API methods |
| `packages/api/src/query-keys.ts` | Edit — add `sharePreview`, `collectionShares` |
| `apps/web/app/accept-invite/[token]/page.tsx` | Create |
| `apps/web/app/collections/page.tsx` | Edit — ownership badge, leave action |
| `apps/web/app/collections/[id]/page.tsx` | Edit — share panel, members list, leave button |
| `apps/web/src/lib/api-instance.ts` | Edit — export new methods if re-exported here |

---

## Implementation order

1. **Step 1 + 2 + 3** — types, API methods, query keys (no UI, pure TS, run `pnpm typecheck` after)
2. **Step 4** — accept-invite page (self-contained, testable in isolation with a real token)
3. **Step 7** — auth redirect (unblock step 4 testing end-to-end)
4. **Step 5** — collections list updates (small, low risk)
5. **Step 6** — collection detail sharing panel (most complex, do last)

---

## Acceptance checklist

- [ ] Owner can generate and copy a share link from a public collection
- [ ] Owner sees a tooltip/prompt when trying to share a private collection
- [ ] Invite URL opens the accept page showing the collection preview
- [ ] Unauthenticated visitor is redirected to login and returned to accept page after
- [ ] Shared user lands on the collection detail after accepting
- [ ] Accepting again (already a member) is a no-op — no error shown
- [ ] Owner cannot accept their own invite (422 shown as error)
- [ ] Invalid/expired token shows a clear error on the accept page
- [ ] Collections list shows "Shared" badge on shared collections
- [ ] Shared collections show "Leave" instead of "Delete" in the list
- [ ] Collection detail shows "Shared with" members panel for owners
- [ ] Owner can revoke individual member access
- [ ] Shared user sees "Leave collection" button on the detail page
- [ ] Leaving navigates back to `/collections` and the collection no longer appears
