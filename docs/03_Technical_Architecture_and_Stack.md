# 03 — Technical Architecture & Technology Stack

## 1. Architecture overview
Monorepo, two deployable apps, one shared DB.
```
Browser (React SPA, Vercel)
   │  HTTPS  /api/* (Vercel rewrite → API, so cookies are same-origin)
   ▼
Express REST API (Render/Railway)  ──►  MongoDB Atlas
   │                                  
   ├──► Cloudinary (image attachments, P1)
   └──► Socket.io (same server, P2 real-time)
```

## 2. Technology decisions
| Layer | Choice | Notes |
|---|---|---|
| Runtime | Node.js 20 LTS or 22 LTS, ES Modules | `"type": "module"` |
| API | Express (latest stable) | Router → Controller → Service → Model layering |
| DB | MongoDB Atlas + Mongoose | |
| Validation | **zod** (server request schemas; client forms via react-hook-form + @hookform/resolvers) | |
| Auth | jsonwebtoken, bcrypt (cost 12), cookie-parser | |
| Security | helmet, cors (allow-list), express-rate-limit, hpp (optional), dotenv | |
| Uploads | multer (memory storage) → Cloudinary `upload_stream` | P1 |
| Logging | morgan (dev) / pino (prod) | |
| Frontend | React 18+/19, Vite, JavaScript | TypeScript optional |
| Styling | Tailwind CSS (latest stable; follow official Vite install guide) | |
| Routing | React Router (v6/v7 data-router OK) | |
| Server state | TanStack Query + native `fetch` wrapper | |
| Client global state | Context API (AuthContext, ToastContext, UIContext) — Redux NOT needed | |
| Forms | react-hook-form + zod | |
| DnD | @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities | |
| Icons | lucide-react | |
| Toasts | sonner or react-hot-toast | |
| Dates | date-fns | |
| Testing (API) | Vitest or Jest + supertest + mongodb-memory-server | |
| Testing (UI) | Vitest + React Testing Library; Playwright for e2e (P1) | |
| Quality | ESLint + Prettier (+ husky/lint-staged optional) | |
| Real-time (P2) | socket.io / socket.io-client | |

## 3. Repository structure
```
trackflow/
├─ docs/                      # these documents + PROGRESS.md
├─ client/
│  ├─ index.html
│  ├─ vite.config.js
│  ├─ .env.example            # VITE_API_URL=/api/v1
│  └─ src/
│     ├─ main.jsx, App.jsx, routes.jsx
│     ├─ api/                 # http.js (fetch wrapper), auth.api.js, projects.api.js, tickets.api.js, comments.api.js
│     ├─ context/             # AuthContext.jsx, ToastProvider
│     ├─ hooks/               # useAuth, useProjects, useTickets, useDebounce, usePermissions
│     ├─ components/
│     │  ├─ ui/               # Button, Input, Modal, Drawer, Badge, Avatar, Spinner, Skeleton, EmptyState...
│     │  ├─ layout/           # AppLayout, Sidebar, Topbar, Breadcrumbs
│     │  ├─ kanban/           # KanbanBoard, KanbanColumn, TicketCard
│     │  ├─ tickets/          # TicketForm, TicketDetail, FilterBar, TicketTable
│     │  ├─ comments/         # CommentList, CommentItem, CommentComposer
│     │  └─ projects/         # ProjectCard, ProjectForm, MemberTable
│     ├─ pages/               # Landing, Login, Register, Dashboard, Projects, Board, ListView, TicketPage, Settings, Profile, NotFound
│     ├─ lib/                 # constants.js, permissions.js, utils.js
│     └─ styles/index.css
└─ server/
   ├─ package.json
   ├─ .env.example
   └─ src/
      ├─ server.js            # bootstrap, DB connect, listen, graceful shutdown
      ├─ app.js               # express app, middleware, routes
      ├─ config/              # env.js (zod-validated env), db.js, cloudinary.js
      ├─ models/              # User, Project, Ticket, Comment, RefreshToken
      ├─ routes/              # auth, users, projects, tickets, comments, attachments
      ├─ controllers/
      ├─ services/            # business logic (ticket positioning, permissions)
      ├─ middleware/          # auth.js, projectAccess.js, validate.js, rateLimit.js, error.js, notFound.js, upload.js
      ├─ validators/          # zod schemas
      ├─ utils/               # ApiError, asyncHandler, tokens, position.js
      ├─ seed/seed.js
      └─ tests/
```

## 4. Authentication design
1. **Register/Login** → server returns `{ accessToken, user }` in JSON and sets `refreshToken` cookie (`httpOnly`, `Secure` in prod, `SameSite=Lax` when same-origin via proxy / `None` only if cross-site is unavoidable, `path=/api/v1/auth`, 7d).
2. Access token: JWT, 15 min, payload `{ sub: userId }`, signed with `JWT_ACCESS_SECRET`. Sent as `Authorization: Bearer`. Stored **in memory** (AuthContext), never localStorage.
3. Refresh token: random 64-byte value (or JWT with `jti`), **hashed (SHA-256) and stored** in `refreshtokens` collection with expiry; rotated on each `/auth/refresh`; reuse of an old token revokes all that user's tokens.
4. Client `http.js`: on 401 → call `/auth/refresh` once (single in-flight promise) → retry original request → else logout and redirect.
5. On app start, AuthContext calls `/auth/refresh` then `/auth/me` to restore session.
6. Same-origin trick: `client/vercel.json` rewrites `/api/(.*)` → `https://<api-host>/api/$1`. Local dev: Vite proxy `/api` → `http://localhost:5000`.

## 5. Authorization design
- `auth` middleware: verifies access token → `req.user`.
- `projectAccess(requiredAction)` middleware: loads project (from `:projectId`, or via ticket/comment → project), finds membership, attaches `req.project`, `req.membership`, and checks the **permission matrix** (PRD §4.1) through a single `can(role, action, resource, user)` function in `services/permissions.js`. Mirror the same rules in `client/src/lib/permissions.js` for UI hiding (UI hiding is cosmetic; server is authoritative).
- Return **404** (not 403) for projects the user isn't a member of, to avoid leaking existence; **403** for members lacking permission.

## 6. Request lifecycle & error handling
`helmet → cors → json(limit 1mb) → cookieParser → rateLimit → routes (validate → auth → projectAccess → controller) → notFound → errorHandler`.
All errors thrown as `ApiError(status, code, message, details?)`. Error handler maps zod errors → 422, Mongoose CastError → 400, duplicate key → 409, JWT errors → 401, unknown → 500 (message hidden in production). Standard response envelope in doc 05.

## 7. Ticket ordering (Kanban)
Each ticket has `position` (Number). New ticket → `maxPositionInColumn + 1024`. Move → client sends `{status, beforeTicketId?, afterTicketId?}`; server computes `position` = midpoint of neighbors (or ±1024 at ends). If gap < 1e-6 → rebalance that column (re-number by 1024 steps). Board query sorts `status, position ASC`.

## 8. Ticket numbering
Project has `ticketSeq` (Number). Create ticket uses atomic `findOneAndUpdate({_id}, {$inc:{ticketSeq:1}}, {new:true})` → `number`. Unique index `(project, number)`.

## 9. File uploads (P1)
`multer.memoryStorage()`, limits 5 MB, mimetype allow-list (image/png, jpeg, webp, gif) + magic-byte check if feasible. Upload to Cloudinary folder `trackflow/<projectId>/<ticketId>`; store `{url, publicId, width, height, size, mimeType, uploadedBy}`. Deleting ticket/project removes assets (best-effort, logged on failure).

## 10. Real-time (P2)
Socket.io on same HTTP server; auth via access token in handshake; rooms `project:<id>`; events: `ticket:created|updated|moved|deleted`, `comment:created|updated|deleted`, `member:changed`. Client invalidates relevant TanStack Query keys on events. Must degrade gracefully if socket is down.

## 11. Environment variables
**server/.env**
```
NODE_ENV=development
PORT=5000
MONGODB_URI=            # Atlas connection string (owner provides)
JWT_ACCESS_SECRET=      # 64+ random chars (agent can generate locally)
JWT_REFRESH_SECRET=     # 64+ random chars, different from above
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=7
CLIENT_URL=http://localhost:5173   # CORS allow-list (comma-separated allowed)
COOKIE_DOMAIN=
CLOUDINARY_CLOUD_NAME=  # P1, owner provides
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```
**client/.env**: `VITE_API_URL=/api/v1`.
Rules: commit only `.env.example`; validate env at boot with zod and fail fast with a readable message; `.gitignore` includes `.env*` (except example), `node_modules`, `dist`.

## 12. Scripts (expected)
server: `dev` (nodemon/`node --watch`), `start`, `test`, `lint`, `seed`. client: `dev`, `build`, `preview`, `test`, `lint`. Root: optional `npm run dev` using `concurrently`.

## 13. Local development without Atlas
If `MONGODB_URI` is not yet provided, agent may use `mongodb-memory-server` for tests and a local MongoDB if installed — but must **ask the owner for the Atlas URI before Phase 11 (deployment)** and as soon as persistent dev data is desired.

## 14. Performance & scalability notes
Indexes per doc 04; `lean()` for read queries; pagination everywhere except the board (cap 500 tickets per project board; warn beyond); avoid N+1 via `populate` with selected fields; gzip via `compression`; React code-splitting per route (`React.lazy`); memoized cards on the board.

## 15. CI (optional P1)
GitHub Actions: install, lint, test (client + server) on push/PR.
