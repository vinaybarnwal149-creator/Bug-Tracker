# 07 — Security, Testing, Deployment & QA

## 1. Security checklist (must all be true before Phase 12)
1. Passwords hashed with bcrypt cost ≥ 12; never logged or returned.
2. Access JWT 15 min; refresh token rotated, stored hashed, httpOnly cookie, `Secure` in prod.
3. Secrets only in env vars; `.env` git-ignored; `.env.example` has no real values.
4. `helmet()` enabled; CORS allow-list from `CLIENT_URL` (no `*` with credentials).
5. Rate limiting on auth + global; body size limit 1 MB.
6. Every request body/query/params validated by zod; unknown fields rejected.
7. NoSQL-injection safe: no raw user objects in Mongo queries (only validated primitives); search text escaped.
8. Authorization on every route via `projectAccess`; IDOR tests (user A cannot read/modify user B's project, ticket, comment, attachment).
9. Generic login errors; no user enumeration on login (member-add by email is allowed only for managers/owners).
10. Error responses hide stack traces in production.
11. XSS: render user text as plain text (React escapes by default); never use `dangerouslySetInnerHTML` for user content; if markdown is added, sanitize.
12. File uploads: size + mimetype allow-list; random server-generated names (Cloudinary public IDs); no executable types.
13. Dependencies: `npm audit` reviewed; lockfiles committed.
14. HTTPS only in production; `trust proxy` set correctly on Render for rate limiter + secure cookies.
15. Graceful shutdown & DB connection error handling.

## 2. Test plan
**Server (supertest + mongodb-memory-server):** auth (register/login/refresh/logout/reuse), projects (CRUD, members, owner invariants), tickets (CRUD, numbering, position/move/rebalance, filters/sort/search/pagination, assignee validation, cascade), comments (threading, permissions, counts), attachments (mocked Cloudinary), permission matrix table-driven test covering every role × action in PRD §4.1.
**Client (Vitest + RTL):** form validation, ProtectedRoute behavior, permission-based rendering, FilterBar → query string, TicketCard rendering, comment threading UI.
**E2E (Playwright, recommended):** the full flow in §3 below.
Coverage target: ≥ 70% server services/middleware; all critical paths covered.

## 3. End-to-end QA script (run before release)
1. Register user A and B → login/logout/reload keeps session.
2. A creates project WEB; adds B as developer (and an unregistered email → clear error).
3. A creates tickets (all types/priorities); WEB-1…N sequential.
4. A assigns ticket to B; B sees it under "Assigned to me".
5. Drag tickets across columns and reorder; reload → order/status persisted.
6. Filter by each field + combination + keyword + sort; URL reflects state; reload preserves.
7. Comment, reply, reply-to-reply (flattens), edit, delete (permissions per role).
8. B (developer) tries to delete A's ticket → blocked. Change B to viewer → controls disabled; API calls return 403.
9. Remove B from project → B's assigned tickets become unassigned; B loses access (404).
10. Upload screenshot (if enabled) → preview, delete.
11. Delete project (type-to-confirm) → all data gone.
12. Mobile (360 px) & tablet (768 px) walkthrough; keyboard-only drag; no console errors; Lighthouse ≥ 90 a11y.

## 4. Deployment guide
### 4.1 MongoDB Atlas
Create free cluster → Database Access: create DB user (strong password) → Network Access: allow `0.0.0.0/0` (free-tier hosts have dynamic IPs) → Connect → Drivers → copy URI, replace `<password>`, append DB name `/trackflow`.
### 4.2 API on Render (or Railway)
- New Web Service from GitHub repo, root dir `server`, build `npm install`, start `npm start`, health check path `/api/v1/health`.
- Env vars: all in doc 03 §11; `NODE_ENV=production`; `CLIENT_URL=https://<vercel-domain>`.
- Free tier sleeps → first request slow; mention in README.
### 4.3 Client on Vercel (or Netlify)
- Root dir `client`, framework Vite, build `npm run build`, output `dist`.
- `client/vercel.json`:
```json
{ "rewrites": [
  { "source": "/api/(.*)", "destination": "https://<render-api-host>/api/$1" },
  { "source": "/(.*)", "destination": "/index.html" }
] }
```
(Netlify equivalent: `_redirects` with `/api/* https://<api-host>/api/:splat 200` and `/* /index.html 200`.)
### 4.4 Post-deploy smoke test
Register on live site, create project/ticket, drag, reload (cookie refresh works), comment, logout. Check browser devtools for CORS/cookie errors.
### 4.5 Common pitfalls
Cookies not set → ensure requests go through the Vercel rewrite (same origin), `trust proxy` enabled, `Secure` cookie only over HTTPS. CORS errors → `CLIENT_URL` mismatch (no trailing slash). SPA 404 on refresh → missing rewrite. Atlas connection timeout → IP allow-list.

## 5. README requirements
Title + badges · live demo link · screenshots (board, ticket detail, mobile) · features · tech stack · architecture diagram · local setup (prereqs, clone, env, install, seed, run) · env var table · scripts · folder structure · API summary (link to doc) · roles & permissions table · deployment notes · testing · roadmap · author/LinkedIn.

## 6. Demo video outline (2–3 min)
Intro (10s) → register/login (15s) → create project + add member (20s) → create ticket + assign (20s) → Kanban drag (25s) → filters/search (20s) → comments (20s) → role restriction demo (15s) → mobile view (10s) → tech stack & wrap-up (15s).
