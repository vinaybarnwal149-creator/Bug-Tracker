# 02 — UI/UX Design & Page Structure

## 1. Design principles
Clean, dense-but-calm productivity UI (Linear/Jira inspired). Fast to scan. Every screen has loading, empty, and error states. Mobile-first responsive. Accessible by default.

## 2. Brand placeholders (use defaults unless the owner supplies assets)
| Item | Default |
|---|---|
| App name | TrackFlow |
| Logo | Text wordmark + simple SVG icon (a checked square). Replace if owner provides logo. |
| Favicon | Generated SVG from the icon. |
| Primary color | Indigo `#4F46E5` (hover `#4338CA`) |
| Neutrals | Tailwind `slate` scale |
| Success / Warning / Danger | `emerald-600` / `amber-500` / `rose-600` |
| Font | Inter (Google Fonts), fallback system-ui |
| Radius / shadow | `rounded-lg` cards, `shadow-sm`, modals `shadow-xl` |
| Dark mode | P2 stretch. Structure Tailwind classes so it can be added later. |

### Semantic colors
- Priority: low=slate, medium=blue, high=amber, critical=rose (badge + icon, never color-only).
- Type: bug=rose icon, feature=violet icon, task=sky icon.
- Status: todo=slate, in_progress=blue, done=emerald.

## 3. Sitemap & routes (React Router)
| Route | Page | Access |
|---|---|---|
| `/` | Landing (simple hero, features, CTA) — redirects to `/dashboard` if logged in | Public |
| `/login`, `/register` | Auth pages | Public only |
| `/dashboard` | Overview + project list | Auth |
| `/projects` | All projects grid + "New project" | Auth |
| `/projects/:projectId` | Redirects to `/board` | Auth+member |
| `/projects/:projectId/board` | Kanban board | Member |
| `/projects/:projectId/list` | Table/list view of tickets | Member |
| `/projects/:projectId/tickets/:ticketKey` | Ticket detail (full page; also opens as drawer from board/list) | Member |
| `/projects/:projectId/settings` | Project details, members & roles, danger zone | Owner/Manager (Viewer/Dev see members read-only) |
| `/profile` | Name, email (read-only), change password | Auth |
| `*` | 404 page | Public |
Also: 403 "No access" and "Project not found" states.

## 4. Global layout
- **Desktop:** left sidebar (240 px, collapsible) + top bar + content area (max-w 1400). Sidebar: logo, Dashboard, Projects, then list of the user's projects (with colored initials), Profile, Logout.
- **Top bar:** breadcrumbs (`Projects / WEB / Board`), project selector dropdown, global "Create ticket" button (when inside a project), user menu (avatar).
- **Mobile (<768 px):** sidebar becomes slide-over drawer (hamburger). Board columns scroll horizontally with snap; filters collapse into a "Filters" sheet.

## 5. Page specifications

### 5.1 Landing `/`
Header (logo, Login, Get started) · Hero ("Track bugs. Ship faster.") · 3–4 feature cards (Kanban, Assign, Comments, Roles) · screenshot placeholder · footer. Keep it a single lightweight page.

### 5.2 Login / Register
Centered card, logo, form (react-hook-form + zod), inline field errors, password show/hide, submit spinner, link to the other page. Server errors shown in a form-level alert. Register fields: name, email, password, confirm password.

### 5.3 Dashboard `/dashboard`
Greeting; stat cards (Assigned to me, In progress, Done this week, Total open); "My open tickets" list (key, title, project, priority, status); "Recent projects" grid; empty state with "Create your first project" CTA.

### 5.4 Projects `/projects`
Grid of project cards: initials avatar, title, key, description (2-line clamp), member avatars (max 4 + "+N"), open/total tickets, your role badge. "New project" modal: title, key (auto-suggested, editable), description.

### 5.5 Board `/projects/:id/board`
```
[Project title • KEY]                     [Search…] [Board|List] [+ Create ticket]
[Status ▾][Priority ▾][Type ▾][Assignee ▾][Sort ▾]  [Clear]
┌─ To Do (4) ─────┐ ┌─ In Progress (2) ┐ ┌─ Done (7) ───────┐
│ [card]          │ │ [card]           │ │ [card]           │
│ [card]          │ │                  │ │                  │
│ + Add ticket    │ │ + Add ticket     │ │ + Add ticket     │
└─────────────────┘ └──────────────────┘ └──────────────────┘
```
**Ticket card:** key (muted), title (2-line clamp), type icon, priority badge, label chips (max 2 +N), due-date chip (red if overdue and not done), assignee avatar, comment count, attachment count.
**Drag behavior:** drag handle = whole card; drag overlay with slight rotation/shadow; drop indicator line; column highlights on hover; optimistic update; error toast + rollback on failure; touch support with press-delay (250 ms) so scrolling still works; keyboard: Space to pick up, arrows to move, Space to drop.
**Viewer:** cards non-draggable, no "+ Add ticket".

### 5.6 List view
Table: Key · Title · Type · Priority · Status · Assignee · Updated · (row menu: Edit/Delete per permission). Sortable headers, pagination, row click opens drawer. On mobile: card-list rendering.

### 5.7 Ticket detail (drawer on board/list; full page on direct URL)
Left/main: key + editable title, description (editable), attachments grid (upload dropzone), **Comments** (composer, threaded list). Right/meta panel: status select, priority, type, assignee select, labels, due date, reporter, created/updated. Actions menu: Copy link, Delete. Inline-edit with save on blur or explicit Save/Cancel; disabled for Viewers.
**Comment UI:** avatar, name, relative time, body, Reply / Edit / Delete (permission-aware), replies indented one level with a left border, composer with Cancel/Comment, Ctrl/Cmd+Enter to submit.

### 5.8 Create/Edit ticket modal
Fields: title*, description, type, priority, status, assignee, labels (tag input), due date, attachments (P1). Validation inline. Focus trapped, Esc closes (confirm if dirty).

### 5.9 Project settings
Tabs: **General** (title, description, key read-only) · **Members** (table: avatar, name, email, role select, remove; "Add member" form: email + role) · **Danger zone** (Leave / Delete project with type-to-confirm).

### 5.10 Profile
Name edit, email (read-only), change-password form, logout button.

## 6. Reusable component inventory
`AppLayout, Sidebar, Topbar, Breadcrumbs, ProjectSwitcher, ProtectedRoute, Button, IconButton, Input, Textarea, Select, TagInput, DatePicker (native date input OK), Avatar, AvatarGroup, Badge (Priority/Type/Status), Card, Modal, Drawer, ConfirmDialog, Dropdown/Menu, Tabs, Toast (e.g., react-hot-toast or sonner), Spinner, Skeleton, EmptyState, ErrorState, Pagination, SearchInput(debounced), FilterBar, KanbanBoard, KanbanColumn, TicketCard, TicketForm, TicketDetail, CommentList, CommentItem, CommentComposer, AttachmentGrid, Lightbox, MemberTable, StatCard`.

## 7. UX states checklist (every data view)
Loading (skeletons) · Empty (illustration/icon + CTA) · Error (message + Retry) · Forbidden (403 message) · Offline/network error toast · Disabled/read-only for Viewer.

## 8. Feedback & microcopy
Toasts: success (create, update, delete, member added), error (API message). Destructive actions always confirm. Button labels are verbs ("Create ticket", "Add member"). Dates: relative ("2h ago") with full date on hover. Priority/status never color-only.

## 9. Accessibility
Semantic landmarks; labels on all inputs; focus ring visible; modals trap focus and restore it; color contrast AA; `aria-live` for toasts; DnD keyboard sensor + announcements; images have alt text.

## 10. Responsive rules
sm 640 / md 768 / lg 1024 / xl 1280. Board: horizontal scroll with column min-width 280 px on < lg; all three columns visible on ≥ lg. Tap targets ≥ 40 px.
