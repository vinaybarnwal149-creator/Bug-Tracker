# Progress Tracker
Last updated: 2026-11-09 23:50 UTC+5:30

## Current phase: Phase 14 — Final QA & Verification Complete

## Status board
| Phase | Status | Tests | Notes |
|---|---|---|---|
| Phase 0: Project setup | Done | Passed | Monorepo, Express app, Vite client, Tailwind, configs |
| Phase 1: Authentication | Done | Passed | User/RefreshToken, JWT, cookies, bcrypt, AuthContext, pages |
| Phase 2: Projects & RBAC | Done | Passed | Project CRUD, membership, permission engine, settings |
| Phase 3: Ticket API | Done | Passed | Ticket CRUD, ordering, midpoint positioning, filter queries |
| Phase 4: Frontend Tickets | Done | Passed | Ticket forms, detail drawer, list view, badges, cards |
| Phase 5: Layout & Dashboard | Done | Passed | AppLayout, responsive sidebar, topbar, dashboard metrics |
| Phase 6: Buffer & Testing | Done | Passed | Vitest suite (17 passed), smoke test (11 passed), docs/api.http |
| Phase 7: Kanban DnD | Done | Passed | @dnd-kit board, 3 columns, position sync, rollback on error |
| Phase 8: Comments | Done | Passed | Threaded comments, 1-level reply flattening, edit & delete |
| Phase 9: Filter/Search/Sort | Done | Passed | Debounced search, URL sync, status/priority/assignee filters |
| Phase 10: Edit/Delete & RBAC UI | Done | Passed | Role-based controls, delete confirmation modals, 403 handling |
| Phase 11: Attachments | Done | Passed | Cloudinary integration with local fallback dropzone & delete |
| Phase 12: Deployment Readiness | Done | Passed | Vercel rewrite config, Render health checks, env templates |
| Phase 13: Polish & Docs | Done | Passed | Complete README.md, code-split bundles, accessibility pass |
| Phase 14: Final QA & Demo | Done | Passed | End-to-end smoke verification script, docs/DEMO_SCRIPT.md |

## Completed requirements (IDs from PRD)
- **FR-AUTH-1..6:** Register, login, silent refresh, token rotation, reuse detection, profile & password management.
- **FR-PROJ-1..6:** Project creation, unique 2-5 letter key, list projects, edit/delete project with cascade, add/remove members with roles.
- **FR-TICK-1..6:** Create ticket, sequential `KEY-N` numbering, ticket detail drawer, edit/delete with RBAC, member assignee select.
- **FR-KAN-1..6:** Fixed 3 columns with counters, @dnd-kit drag and drop, midpoint position calculation, viewer lock, column shortcut "+ Add ticket".
- **FR-CMT-1..4:** Add comments, 1-level nested replies, edit own comment, delete with permissions, author/time info.
- **FR-FIL-1..6:** Filters by status, priority, type, assignee, debounced search (300ms), sort options, URL query string sync, paginated list view.
- **FR-ATT:** Image attachments support with fallback and lightbox preview.
- **FR-DASH:** Dashboard metric cards, active projects overview, welcome header.

## Decisions & assumptions made (with reason)
1. **In-Memory MongoDB fallback:** If `MONGODB_URI` is not supplied or local mongod is stopped, automatically launches `mongodb-memory-server` in development/test mode for effortless setup.
2. **React 18 + Vite with Code-Splitting:** Configured route-based `lazy` imports with micro-chunks for instant initial loading.
3. **Pure JS `bcryptjs`:** Used to eliminate C++ build tool dependencies on Windows platforms.

## Blockers / Waiting on owner
- None for local execution.
- When ready to deploy to Render/Vercel (Phase 12 production), provide MongoDB Atlas URI and Cloudinary credentials in `server/.env`.

## How to run (commands) / URLs
- **Run dev servers:** `npm run dev`
- **Client URL:** `http://localhost:5173`
- **Server API:** `http://localhost:5000/api/v1`
- **Run tests:** `npm run test`
- **Run smoke test:** `node server/src/tests/smoke.js`
- **Seed database:** `npm run seed`
