# 04 — Database Design (MongoDB + Mongoose)

All collections use `timestamps: true` (`createdAt`, `updatedAt`). IDs are ObjectId. Never return password hashes or token hashes (`select:false` / `toJSON` transform).

## 1. Entity relationships
```
User 1───* Project.members (embedded {user, role})
Project 1───* Ticket          (Ticket.project)
User 1───* Ticket             (reporter, assignee)
Ticket 1───* Comment          (Comment.ticket)
Comment 1───* Comment         (Comment.parent, one level)
User 1───* RefreshToken
Ticket 1───* attachments      (embedded array)
```

## 2. Schemas

### 2.1 `users`
| Field | Type | Rules |
|---|---|---|
| name | String | required, trim, 2–60 |
| email | String | required, unique, lowercase, trim, valid email |
| password | String | required, bcrypt hash, `select:false` |
| avatarColor | String | auto-assigned from palette (used for initials avatar) |
| lastLoginAt | Date | optional |
Indexes: `{ email: 1 }` unique.

### 2.2 `refreshtokens`
| Field | Type | Rules |
|---|---|---|
| user | ObjectId→User | required, indexed |
| tokenHash | String | SHA-256 of token, unique |
| expiresAt | Date | TTL index `expireAfterSeconds: 0` |
| revokedAt | Date | optional |
| replacedBy | String | optional (rotation chain) |
| userAgent, ip | String | optional |

### 2.3 `projects`
| Field | Type | Rules |
|---|---|---|
| title | String | required, 2–80 |
| key | String | required, unique, uppercase, regex `^[A-Z]{2,5}$` |
| description | String | ≤ 1000 |
| owner | ObjectId→User | required |
| members | [{ user: ObjectId→User, role: 'owner'\|'manager'\|'developer'\|'viewer', joinedAt: Date }] | owner always present exactly once; no duplicate users |
| ticketSeq | Number | default 0 (atomic counter) |
Indexes: `{ key: 1 }` unique; `{ 'members.user': 1 }`; `{ owner: 1 }`.

### 2.4 `tickets`
| Field | Type | Rules |
|---|---|---|
| project | ObjectId→Project | required, indexed |
| number | Number | required; unique with project |
| key | String | virtual or stored `${project.key}-${number}` (store for fast search) |
| title | String | required, trim, 1–120 |
| description | String | ≤ 5000 |
| type | String | enum `bug,feature,task` default `bug` |
| priority | String | enum `low,medium,high,critical` default `medium` |
| status | String | enum `todo,in_progress,done` default `todo` |
| position | Number | required; ordering within `(project,status)` |
| reporter | ObjectId→User | required |
| assignee | ObjectId→User | nullable; must be project member (validated in service) |
| labels | [String] | ≤5, each ≤24, lowercase trim |
| dueDate | Date | nullable |
| attachments | [{ url, publicId, fileName, mimeType, size, width, height, uploadedBy, uploadedAt }] | ≤5 |
| commentCount | Number | default 0 (maintained on comment create/delete) |
| completedAt | Date | set when status→done, cleared otherwise |
Indexes: `{project:1, number:1}` unique; `{project:1, status:1, position:1}`; `{project:1, assignee:1}`; `{project:1, priority:1}`; `{project:1, createdAt:-1}`; `{project:1, key:1}`; optional text index on `title, description` (default search uses escaped case-insensitive regex across `key,title,description`).

### 2.5 `comments`
| Field | Type | Rules |
|---|---|---|
| ticket | ObjectId→Ticket | required, indexed |
| project | ObjectId→Project | required (denormalized for permission checks) |
| author | ObjectId→User | required |
| body | String | required, 1–2000, trim |
| parent | ObjectId→Comment | nullable; if set, parent must itself have `parent = null` (replies to replies attach to the root) |
| editedAt | Date | nullable |
Indexes: `{ticket:1, createdAt:1}`; `{parent:1}`.

### 2.6 (P2) `activities`
`{ ticket, project, actor, action (created|updated|moved|assigned|commented), field?, from?, to?, createdAt }` index `{ticket:1, createdAt:-1}`.

## 3. Integrity & cascade rules (implement in services, wrap in transactions only if Atlas replica set is available — Atlas is)
- Delete project → delete its tickets, comments, Cloudinary assets, in that order.
- Delete ticket → delete its comments + attachments.
- Delete comment → delete its replies; decrement `commentCount` accordingly.
- Remove member / member leaves → `tickets.updateMany({project, assignee:user}, {assignee:null})`.
- Role changes: cannot demote/remove the owner; at least one owner always exists.
- Assignee validation on every create/update/assign.

## 4. Querying notes
- "My projects": `Project.find({'members.user': userId})` + aggregated ticket counts.
- Board: `Ticket.find({project, ...filters}).sort({status:1, position:1}).populate('assignee','name email avatarColor').lean()` then group by status.
- List: same with `sort`, `skip`, `limit`; return `meta.total`.
- Priority sort: store numeric weight or use `$addFields` rank (critical=4…low=1) in aggregation.
- Escape user search text: `q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`.

## 5. Seed data (`npm run seed`, dev only — refuses to run in production)
- 4 users (password `Password123!`): `owner@demo.com`, `manager@demo.com`, `dev@demo.com`, `viewer@demo.com`.
- 2 projects (“Website Revamp” key `WEB`, “Mobile App” key `MOB`) with all four roles in WEB.
- ~25 tickets across statuses/priorities/types with assignees, labels, due dates; ~15 comments with replies.
