# 01 — Product Requirements Document (PRD)
**Project:** Bug / Issue Tracker (Jira/Linear-style) — working name: **TrackFlow** (placeholder; owner may rename)
**Document purpose:** Single source of truth for WHAT is being built. Other docs (02–08) define HOW.
**Reading order for agents:** 01 → 03 → 04 → 05 → 02 → 06 → 07 → 08.

---
## 1. Overview
A web application where teams create projects, report bugs/feature requests as tickets, assign them to project members, move them across a Kanban board (To Do → In Progress → Done), collaborate through threaded comments, and filter/search/sort issues. Access is protected by JWT auth and per-project role-based permissions.

## 2. Goals
1. Deployed, live, responsive web app with JWT auth.
2. Functional drag-and-drop Kanban board persisted to the database.
3. Ticket create / edit / delete / assign / filter / search / sort.
4. Threaded comments on tickets.
5. Role-based access (Owner, Manager, Developer, Viewer) enforced on the **server** and reflected in the UI.
6. Clean GitHub repo with README + screenshots; demo video.

## 3. Non-goals (v1)
Payments/billing, sprints/epics/roadmaps, time tracking, email notifications, SSO/Google login, mobile native apps, multi-language (i18n), custom workflows/statuses. (Statuses are fixed: `todo`, `in_progress`, `done`.)

## 4. Personas & Roles (per project)
| Role | Description |
|---|---|
| **Owner** | Creator of the project. Full control, incl. deleting the project. Exactly one per project. |
| **Manager** | Manages members, tickets, settings. Cannot delete project or change Owner. |
| **Developer** | Creates/works tickets, comments, moves tickets. Limited edit/delete. |
| **Viewer** | Read-only (can view board, tickets, comments). |

### 4.1 Permission matrix (enforced server-side)
| Action | Owner | Manager | Developer | Viewer |
|---|:-:|:-:|:-:|:-:|
| View project, board, tickets, comments | ✅ | ✅ | ✅ | ✅ |
| Create ticket | ✅ | ✅ | ✅ | ❌ |
| Edit ticket fields | ✅ any | ✅ any | ✅ only if reporter or assignee | ❌ |
| Move ticket (change status/order) | ✅ | ✅ | ✅ | ❌ |
| Assign / unassign ticket | ✅ | ✅ | ✅ only own/reported tickets | ❌ |
| Delete ticket | ✅ any | ✅ any | ✅ only if reporter | ❌ |
| Add comment / reply | ✅ | ✅ | ✅ | ❌ |
| Edit own comment | ✅ | ✅ | ✅ | ❌ |
| Delete comment | ✅ any | ✅ any | own only | ❌ |
| Upload/delete attachment | ✅ | ✅ | ✅ (delete own uploads only) | ❌ |
| Add/remove members, change roles | ✅ | ✅ (cannot touch Owner; cannot assign Owner) | ❌ | ❌ |
| Edit project title/description | ✅ | ✅ | ❌ | ❌ |
| Delete project | ✅ | ❌ | ❌ | ❌ |
| Leave project | ❌ (must delete) | ✅ | ✅ | ✅ |

## 5. Scope by priority
- **P0 (MVP, must ship):** UC1 Auth, UC2 Projects & members, UC3 Create issue, UC4 Assign, UC5 Kanban, UC6 Comments, UC7 Filter/Search/Sort, UC8 Edit/Delete with permissions, UC9 Role-based access, deployment, README.
- **P1 (include):** UC10 Screenshot attachments (Cloudinary), toasts/loaders, dashboard stats, list/table view.
- **P2 (stretch, only after P0+P1 are done & tested):** Socket.io real-time updates, dark mode, email invites for unregistered users, ticket activity history, keyboard shortcuts.

## 6. Functional Requirements (with acceptance criteria)

### FR-AUTH — Authentication
- FR-AUTH-1 Register with name, email, password. *AC:* email unique (case-insensitive); password ≥ 8 chars with ≥1 letter & ≥1 number; password stored as bcrypt hash (cost 12); response never contains the hash.
- FR-AUTH-2 Login with email+password. *AC:* wrong credentials return generic 401 "Invalid email or password"; success returns access token + sets refresh cookie.
- FR-AUTH-3 Session persistence. *AC:* page refresh keeps user logged in via refresh-token cookie; access token is short-lived (15 min) and kept in memory.
- FR-AUTH-4 Logout invalidates refresh token server-side and clears cookie.
- FR-AUTH-5 Protected routes. *AC:* unauthenticated users are redirected to /login and returned to intended page after login; API returns 401 without valid token.
- FR-AUTH-6 Profile: update name, change password (requires current password).

### FR-PROJ — Projects
- FR-PROJ-1 Create project (title, description, key). *AC:* creator becomes Owner; `key` is 2–5 uppercase letters, globally unique (UI auto-suggests from title).
- FR-PROJ-2 List "my projects" (member of), with member count and open/total ticket counts.
- FR-PROJ-3 Edit / delete project. *AC:* delete requires confirmation modal typing project title; cascades to tickets, comments, attachments (incl. Cloudinary assets).
- FR-PROJ-4 Add member by email with a role. *AC:* user must already be registered (else clear error "No user with that email — ask them to register first"); duplicates rejected.
- FR-PROJ-5 Change member role / remove member. *AC:* removing a member unassigns their tickets (assignee → null).
- FR-PROJ-6 Leave project (non-owner).

### FR-TICK — Tickets
- FR-TICK-1 Create ticket: title (req, ≤120), description (≤5000, markdown-lite/plain text), type (`bug|feature|task`), priority (`low|medium|high|critical`, default medium), status (default `todo`), assignee (optional, must be a project member), labels (optional, ≤5), due date (optional).
- FR-TICK-2 Human-readable key `KEY-N` (e.g., `WEB-12`), sequential per project, never reused.
- FR-TICK-3 Ticket detail view (drawer/modal + deep-linkable page) showing all metadata, reporter, assignee, createdAt/updatedAt, comments, attachments.
- FR-TICK-4 Edit ticket (permission-based). FR-TICK-5 Delete ticket with confirmation (permission-based).
- FR-TICK-6 Assign/unassign. *AC:* assignee dropdown lists only project members; avatar + name shown on cards.

### FR-KAN — Kanban Board
- FR-KAN-1 Three fixed columns with counts. FR-KAN-2 Drag a card between and within columns. *AC:* UI updates optimistically, persists via API, and rolls back with an error toast on failure; order within a column persists across reload.
- FR-KAN-3 Viewers cannot drag (cards not draggable; visual hint). FR-KAN-4 Board respects active filters. FR-KAN-5 Keyboard-accessible drag (dnd-kit keyboard sensor).
- FR-KAN-6 "+ Add ticket" shortcut at the top of each column pre-sets the status.

### FR-CMT — Comments
- FR-CMT-1 Add comment (≤2000 chars). FR-CMT-2 Reply to a comment (**one nesting level**: replies to replies attach to the same parent). FR-CMT-3 Show author, relative time, "edited" flag. FR-CMT-4 Edit/delete per permission matrix; deleting a parent deletes its replies.

### FR-FIL — Filter, Search, Sort
- FR-FIL-1 Filter by status, priority, type, assignee (incl. "Me" and "Unassigned"). FR-FIL-2 Keyword search over key, title, description (debounced 300 ms). FR-FIL-3 Sort by created, updated, priority, due date (asc/desc). FR-FIL-4 Filters reflected in URL query string (shareable). FR-FIL-5 "Clear filters" action and empty-state message.
- FR-FIL-6 List view paginates (default 20/page).

### FR-ATT — Attachments (P1)
- Images only (png/jpg/webp/gif), ≤5 MB each, ≤5 per ticket; stored on Cloudinary; thumbnails + lightbox preview.

### FR-DASH — Dashboard (P1)
- Cards: total tickets, open, in progress, done, assigned to me; recent tickets; per-project summary.

## 7. Non-Functional Requirements
- **Security:** OWASP basics — see doc 07. **Performance:** board loads < 2 s with 200 tickets. **Responsive:** 360 px → 1440 px+. **Accessibility:** WCAG AA contrast, labels, focus states, keyboard DnD. **Browser support:** latest Chrome, Edge, Firefox, Safari. **Code quality:** ESLint + Prettier, no `console.log` in production code, no secrets in git.

## 8. Decisions already made (agent must NOT re-ask)
| Topic | Decision | Reason |
|---|---|---|
| Database | **MongoDB Atlas + Mongoose** | Project is MERN-based; flexible schema, free tier. (Postgres is out of scope.) |
| DnD library | **@dnd-kit** | `react-beautiful-dnd` is deprecated/unmaintained. |
| Bundler | **Vite** (React, JavaScript) | Fast, standard. TypeScript is optional — default **JavaScript** unless user says otherwise. |
| Server state | **TanStack Query** on top of native `fetch` | Caching, optimistic updates. Auth/UI state via **Context API**. |
| Auth | Short-lived JWT access token (memory) + rotating refresh token (httpOnly cookie) | Safer than localStorage tokens. |
| Hosting | API → Render (or Railway); Client → Vercel; DB → Atlas | Free tiers. |
| File storage | Cloudinary | Render disk is ephemeral. |
| Member invites v1 | Add existing registered users by email | No email service needed. |
| Real-time | P2 stretch via Socket.io | Not required for MVP. |

## 9. Information required from the owner (agent must ask only for these, at the stated time)
See `08_Assets_and_Credentials_Checklist.md`. Everything else has a documented default — use the default and note it in `docs/PROGRESS.md`.

## 10. Definition of Done (global)
A feature is done only when: (1) code complete incl. validation + error handling, (2) permission checks verified, (3) automated tests written & passing, (4) manually verified in the browser at mobile and desktop widths, (5) no console errors, (6) loading/empty/error states exist, (7) `docs/PROGRESS.md` updated.
