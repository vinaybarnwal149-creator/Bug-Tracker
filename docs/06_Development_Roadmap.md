# 06 — Development Roadmap & Implementation Plan

Mapped to the original 14-day schedule. The agent works **phase by phase**; a phase is complete only when its Exit Criteria pass (see Definition of Done in PRD §10). Maintain `docs/PROGRESS.md` after each phase (template at bottom).

> Note: the permission engine (`can()` + `projectAccess`) is built early (Phase 2–3) because every later route depends on it; UI polish for roles is finalized in Phase 10.

---
## Phase 0 — Project setup (Day 1)
**Tasks:** create monorepo (`client`, `server`, `docs`); `git init`, `.gitignore`, root README stub; server: Express app skeleton, zod-validated env, Mongo connect, `/health`, error/notFound middleware, helmet/cors/rate-limit/morgan; client: Vite React, Tailwind, React Router, TanStack Query, base layout shell, `http.js` wrapper; ESLint/Prettier on both; Vite proxy; `.env.example` files; copy docs to `/docs`; create `docs/PROGRESS.md`.
**Exit:** `npm run dev` starts both apps; `/health` returns ok; Tailwind styles render; lint passes.
**Needs from owner:** MongoDB Atlas URI (can defer — agent uses in-memory/local DB meanwhile), GitHub repo URL (optional now), app name/logo preference (default used otherwise).

## Phase 1 — Authentication (Day 2)
**Tasks:** User + RefreshToken models; register/login/refresh/logout/me; bcrypt+JWT; auth middleware; rate limiting; client AuthContext, Login/Register pages, ProtectedRoute/PublicOnlyRoute, silent refresh on boot, 401 retry logic; Profile page (name, password).
**Tests:** register dup email 409, weak password 422, login wrong pw 401, refresh rotation, reuse detection, protected route 401, password hash never returned.
**Exit:** full register→login→refresh-reload→logout flow works in browser.
**Needs from owner:** JWT secrets are auto-generated locally by the agent — nothing required.

## Phase 2 — Projects & members + permission engine (Day 3)
**Tasks:** Project model; CRUD; key availability; members add/update/remove/leave; `permissions.js` + `projectAccess` middleware; client Projects page, ProjectForm modal, Project Settings (General + Members), sidebar project list, project switcher.
**Tests:** only members can read; manager can't touch owner; owner-only delete; duplicate member 409; removing member unassigns tickets (once tickets exist — add test in Phase 3).
**Exit:** two seeded users can collaborate on a project with different roles.

## Phase 3 — Ticket model & API (Day 4)
**Tasks:** Ticket model with counters/position; create/list/get/update/assign/move/delete; board endpoint; filters/sort/search/pagination server-side (build all of it now; UI later); stats endpoint; cascade deletes; seed script.
**Tests:** key sequencing under concurrency, assignee must be member, filters combos, move/reorder/rebalance, permission matrix per role, cascade.
**Exit:** all ticket endpoints pass tests; Postman/Thunder collection or `docs/api.http` file created.

## Phase 4 — Frontend tickets: create & display (Day 5)
**Tasks:** TicketForm modal, ticket list (table) view, TicketCard, Badges, Avatar, TicketDetail drawer + page (read), toasts, loading/empty/error states.
**Exit:** create a ticket from UI; see it in list with metadata.

## Phase 5 — Layout, dashboard, responsive (Day 6)
**Tasks:** AppLayout (sidebar/topbar/breadcrumbs), Dashboard with stats + my tickets, mobile drawer nav, Landing page, 404/403 pages.
**Exit:** all pages navigable; mobile layout verified at 360/768/1280.

## Phase 6 — Buffer & testing (Day 7)
**Tasks:** fix bugs; run full test suites; add `docs/api.http`; review security checklist (doc 07 §1) items 1–10; push to GitHub.
**Exit:** zero failing tests; no console errors; lint clean.

## Phase 7 — Kanban drag-and-drop (Day 8)
**Tasks:** dnd-kit board (3 columns, sortable within and across), DragOverlay, optimistic update via TanStack Query with rollback, `move` API integration, viewer lock, touch + keyboard sensors, column "+ Add ticket", board filter integration.
**Exit:** drag persists after reload; failed move rolls back; works on touch emulation.

## Phase 8 — Comments (Day 9)
**Tasks:** Comment model + API; CommentList/Item/Composer; replies (1 level), edit/delete w/ permissions; `commentCount` on cards.
**Tests:** reply-to-reply flattening, permission matrix, cascade delete.
**Exit:** collaboration works between two browser sessions.

## Phase 9 — Filter, search, sort UI (Day 10)
**Tasks:** FilterBar (status, priority, type, assignee, search debounce, sort), URL query sync, clear filters, empty results state, pagination in list view; apply to board.
**Exit:** every filter combo returns correct results; URL shareable.

## Phase 10 — Edit/Delete & RBAC UI polish (Day 11)
**Tasks:** edit modal/inline edit, delete confirm dialogs, client `permissions.js` mirrors server, hide/disable controls per role, 403 handling, member management UX polish, project delete type-to-confirm.
**Exit:** a manual role-by-role walkthrough (4 seeded users) matches PRD §4.1 exactly.

## Phase 11 — P1: Attachments (Day 11–12, before deploy)
**Tasks:** Cloudinary config, multer upload, validation, AttachmentGrid, Lightbox, delete.
**Needs from owner:** Cloudinary cloud name/API key/secret (skip → feature flagged off, UI hidden).

## Phase 12 — Deployment (Day 12)
**Tasks:** follow doc 07 §4. Production env vars, CORS, cookie settings, Vercel rewrite, Render health check, Atlas network access, smoke test on live URLs.
**Needs from owner:** Atlas production URI + IP allow-list set to `0.0.0.0/0` (or Render IPs), Render/Railway account access (agent provides exact click-by-click steps if it can't deploy directly), Vercel account, GitHub repo, optional custom domain.
**Exit:** live URLs work end-to-end including refresh/cookies.

## Phase 13 — Polish + README (Day 13)
**Tasks:** responsive audit, loaders/skeletons/toasts everywhere, a11y pass, favicon/meta tags, README (overview, features, tech stack, screenshots, setup, env vars, scripts, deployment, API summary, roles, roadmap, license), screenshots folder.
**Needs from owner:** screenshots (agent can capture via browser tool if available), final app name/logo.

## Phase 14 — Final QA & demo (Day 14)
**Tasks:** run full E2E checklist (doc 07 §3), fix issues, tag release `v1.0.0`, produce `docs/DEMO_SCRIPT.md` (2–3 min walkthrough outline).
**Owner does:** record video, publish to GitHub/LinkedIn.

## Phase 15 — P2 stretch (only if time remains and P0/P1 done)
Socket.io real-time → dark mode → activity history → email invites (needs Resend/SMTP key) → keyboard shortcuts.

---
## `docs/PROGRESS.md` template (agent creates & maintains)
```
# Progress Tracker
Last updated: <date/time>
## Current phase: <n — name>
## Status board
| Phase | Status (Not started/In progress/Blocked/Done) | Tests | Notes |
## Completed requirements (IDs from PRD)
## Pending requirements
## Decisions & assumptions made (with reason)
## Blockers / Waiting on owner
## Known issues
## How to run (commands) / URLs
```
