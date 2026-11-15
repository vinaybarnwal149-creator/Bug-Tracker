# 05 — REST API Specification

Base URL: `/api/v1` · Format: JSON · Auth: `Authorization: Bearer <accessToken>` unless marked Public · Refresh token lives in httpOnly cookie.

## 1. Conventions
**Success:** `{ "success": true, "data": <payload>, "meta": { ... optional pagination ... } }`
**Error:** `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Human readable", "details": [ { "field": "email", "message": "Invalid email" } ] } }`
| HTTP | When | code examples |
|---|---|---|
| 200/201/204 | OK / Created / No content | |
| 400 | Malformed id/request | BAD_REQUEST |
| 401 | Missing/expired/invalid token or bad credentials | UNAUTHORIZED, TOKEN_EXPIRED |
| 403 | Authenticated, not permitted | FORBIDDEN |
| 404 | Not found (or hidden project) | NOT_FOUND |
| 409 | Duplicate | EMAIL_TAKEN, KEY_TAKEN, ALREADY_MEMBER |
| 422 | Validation failure (zod) | VALIDATION_ERROR |
| 429 | Rate limit | RATE_LIMITED |
| 500 | Unexpected | INTERNAL_ERROR |
Pagination meta: `{ page, limit, total, totalPages }`. Dates ISO-8601 UTC. Responses use `id` (not `_id`).
Rate limits: auth routes 10 req/15 min/IP (login/register); general API 300 req/15 min/IP.

## 2. Auth & Users
| Method & Path | Access | Body | Response |
|---|---|---|---|
| POST `/auth/register` | Public | `{name,email,password}` | 201 `{accessToken,user}` + cookie |
| POST `/auth/login` | Public | `{email,password}` | 200 `{accessToken,user}` + cookie |
| POST `/auth/refresh` | Cookie | — | 200 `{accessToken,user}`; rotates cookie |
| POST `/auth/logout` | Cookie | — | 204; revokes token, clears cookie |
| GET `/auth/me` | Auth | — | `{user}` |
| PATCH `/users/me` | Auth | `{name}` | `{user}` |
| PATCH `/users/me/password` | Auth | `{currentPassword,newPassword}` | 204; revokes other refresh tokens |
User object: `{ id, name, email, avatarColor, createdAt }`.

## 3. Projects & Members
| Method & Path | Min role | Body / Query | Response |
|---|---|---|---|
| GET `/projects` | Auth | — | `[ {id,title,key,description,myRole,memberCount,ticketCounts:{todo,in_progress,done},members:[{user,role}] (first 4)} ]` |
| POST `/projects` | Auth | `{title,key,description?}` | 201 project (creator = owner) |
| GET `/projects/:projectId` | viewer | — | project with full `members:[{user:{id,name,email,avatarColor},role,joinedAt}]`, `myRole` |
| PATCH `/projects/:projectId` | manager | `{title?,description?}` (key immutable) | project |
| DELETE `/projects/:projectId` | owner | — | 204 (cascade) |
| GET `/projects/:projectId/stats` | viewer | — | `{total,todo,in_progress,done,assignedToMe,overdue,byPriority:{...}}` |
| GET `/projects/key-available?key=WEB` | Auth | — | `{available:boolean}` |
| POST `/projects/:projectId/members` | manager | `{email,role}` (role ≠ owner) | 201 member; 404 `USER_NOT_FOUND` if email unregistered; 409 if already member |
| PATCH `/projects/:projectId/members/:userId` | manager | `{role}` | member (role may be manager/developer/viewer; the owner's role cannot be changed and owner cannot be granted) |
| DELETE `/projects/:projectId/members/:userId` | manager (or self to leave) | — | 204; unassigns tickets |

## 4. Tickets
| Method & Path | Min role | Notes |
|---|---|---|
| GET `/projects/:projectId/board` | viewer | Query: same filters as list (no pagination). Response `{ todo:[ticket], in_progress:[ticket], done:[ticket] }` each sorted by `position`. |
| GET `/projects/:projectId/tickets` | viewer | Query below → paginated list |
| POST `/projects/:projectId/tickets` | developer | Create |
| GET `/tickets/:ticketId` | viewer | `:ticketId` may be ObjectId **or** key (`WEB-12`) — keys require `?project=<projectId>` |
| PATCH `/tickets/:ticketId` | per matrix | Partial update of `title,description,type,priority,labels,dueDate` |
| PUT `/tickets/:ticketId/assignee` | per matrix | `{assigneeId: string\|null}` |
| PATCH `/tickets/:ticketId/move` | developer | `{status, beforeTicketId?, afterTicketId?}` |
| DELETE `/tickets/:ticketId` | per matrix | 204 (cascade) |

**List/board query params:** `status` (comma list), `priority` (comma list), `type` (comma list), `assignee` (userId | `me` | `unassigned`), `q` (keyword, ≤100), `sort` (`createdAt|updatedAt|priority|dueDate`, prefix `-` for desc; default `-createdAt`), `page` (default 1), `limit` (default 20, max 100).

**Create body:** `{ title*, description?, type?, priority?, status?, assigneeId?, labels?, dueDate? }`
**Ticket object:**
```json
{
  "id": "…", "key": "WEB-12", "number": 12, "projectId": "…",
  "title": "Login button unresponsive on Safari", "description": "…",
  "type": "bug", "priority": "high", "status": "todo", "position": 2048,
  "reporter": { "id":"…","name":"…","avatarColor":"#…" },
  "assignee": { "id":"…","name":"…","avatarColor":"#…" } | null,
  "labels": ["frontend"], "dueDate": "2026-12-01T00:00:00.000Z" | null,
  "attachments": [ { "id":"…","url":"https://…","fileName":"shot.png","size":120394,"width":1200,"height":800 } ],
  "commentCount": 3, "completedAt": null,
  "createdAt":"…","updatedAt":"…"
}
```
**Move semantics:** server validates target status, finds neighbors (`afterTicketId` = ticket directly above, `beforeTicketId` = ticket directly below in target column; both omitted = empty column), computes new `position`, sets `completedAt` when moving to `done`, rebalances if needed, returns the updated ticket **and** `{ rebalanced: boolean }`. If rebalanced, client refetches the board.

## 5. Comments
| Method & Path | Min role | Body | Notes |
|---|---|---|---|
| GET `/tickets/:ticketId/comments` | viewer | — | Returns root comments (oldest first) each with `replies:[…]` (oldest first); author populated |
| POST `/tickets/:ticketId/comments` | developer | `{body, parentId?}` | If parent is itself a reply, attach to its root. Increments `commentCount`. |
| PATCH `/comments/:commentId` | author | `{body}` | sets `editedAt` |
| DELETE `/comments/:commentId` | author, or manager+ | — | 204; removes replies |

## 6. Attachments (P1)
| Method & Path | Min role | Notes |
|---|---|---|
| POST `/tickets/:ticketId/attachments` | developer | `multipart/form-data`, field `files` (≤5 per request, ≤5 MB each, images only) → returns updated `attachments` |
| DELETE `/tickets/:ticketId/attachments/:attachmentId` | developer(own)/manager+ | 204; deletes Cloudinary asset |

## 7. Utility
GET `/health` (Public) → `{status:"ok", uptime, time}` (used by Render health check). Unknown routes → 404 envelope.

## 8. Validation rules (zod)
- email: valid, lowercase, ≤254 · name: 2–60 · password: 8–72, ≥1 letter, ≥1 number
- project.key: `/^[A-Z]{2,5}$/` · title: 2–80 · description ≤1000
- ticket.title 1–120 · description ≤5000 · labels ≤5 × ≤24 · dueDate valid ISO date
- comment.body 1–2000
- all `:id` params validated as ObjectId → 400 otherwise
- reject unknown fields (`.strict()`) on create/update bodies

## 9. Example flows
**Register → create project → create ticket → move**
1. `POST /auth/register` → token
2. `POST /projects {title:"Website Revamp",key:"WEB"}`
3. `POST /projects/:id/tickets {title:"Fix header", priority:"high"}` → `WEB-1`
4. `PATCH /tickets/:id/move {status:"in_progress", afterTicketId:null, beforeTicketId:null}`

## 10. Real-time events (P2, Socket.io)
Server → client in room `project:<id>`: `ticket:created {ticket}`, `ticket:updated {ticket}`, `ticket:moved {ticket}`, `ticket:deleted {ticketId}`, `comment:created|updated|deleted {ticketId, comment|commentId}`, `member:changed {projectId}`. Client → server: `project:join {projectId}` (server verifies membership), `project:leave`.
