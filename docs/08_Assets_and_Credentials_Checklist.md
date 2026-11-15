# 08 — Assets, Credentials & Inputs Checklist (what the owner must provide)

**Rules for the agent:** Do not stop work for items marked *Default available*. Use the default, log it in `docs/PROGRESS.md`, and continue. Stop and ask only for items marked **BLOCKING**, and ask at the time listed — in this format:
> **I need from you:** <item> · **Why:** <reason> · **How to get it:** <steps> · **Meanwhile:** <what I'll do in the meantime>

**Rules for the owner:** Never paste secrets in chat or documents. Put them in `server/.env` yourself (or tell the agent to create the file and fill in the value you type locally). Never commit `.env`.

| # | Item | Needed by | Required? | Why | How to get it | Default / fallback |
|---|---|---|---|---|---|---|
| 1 | App name | Phase 0 | Optional | Branding in UI, README | Decide a name | "TrackFlow" |
| 2 | Logo (SVG/PNG, ≥512 px, transparent) + favicon | Phase 5 | Optional | Branding | Design in Canva/Figma | Generated text wordmark + SVG icon |
| 3 | Brand colors | Phase 0 | Optional | Theme | Hex codes | Indigo palette (doc 02) |
| 4 | Landing-page copy (headline, 4 feature blurbs) | Phase 5 | Optional | Marketing page | Write or approve agent draft | Agent drafts copy |
| 5 | Screenshots/hero image | Phase 13 | Optional | README/landing | Agent captures from running app | Placeholder |
| 6 | **MongoDB Atlas connection URI** | Phase 0 (dev) / Phase 12 (prod) | **BLOCKING by Phase 12** | Database | Doc 07 §4.1 | Agent uses in-memory/local Mongo until then |
| 7 | JWT access & refresh secrets | Phase 1 | Auto | Signing tokens | Agent generates with `crypto.randomBytes(64)`; owner generates separate ones for production | Local dev secrets generated |
| 8 | GitHub repository (empty repo URL, or permission to init) | Phase 6 | Recommended | Version control, deploy | Create repo on GitHub | Local git only |
| 9 | Cloudinary cloud name, API key, API secret | Phase 11 | Optional (for P1 attachments) | Image storage | cloudinary.com free account → Dashboard | Attachments feature flagged off, UI hidden |
| 10 | Render (or Railway) account | Phase 12 | **BLOCKING for deployment** | API hosting | Sign up with GitHub | Agent writes step-by-step instructions |
| 11 | Vercel (or Netlify) account | Phase 12 | **BLOCKING for deployment** | Frontend hosting | Sign up with GitHub | Agent writes step-by-step instructions |
| 12 | Production CLIENT_URL / custom domain | Phase 12 | Optional | CORS, branding | Buy domain (Namecheap/GoDaddy) or use `*.vercel.app` | Use vercel.app subdomain |
| 13 | Email service key (Resend/SMTP) | P2 only | Optional | Email invites/notifications | resend.com | Not built |
| 14 | Choice: JavaScript vs TypeScript | Phase 0 | Optional | Codebase language | Tell the agent | JavaScript |
| 15 | Confirm role names/permissions OK | Phase 2 | Optional | RBAC | Review PRD §4.1 | As documented |
| 16 | Demo video | Phase 14 | Owner task | Portfolio | Record with Loom/OBS | — |
| 17 | Payment gateway, Stripe, maps, analytics keys | — | **Not needed** | Not part of this project | — | Out of scope |

## Credential handling instructions for agent
- Create `server/.env.example` and `client/.env.example` with empty values and comments.
- Create `server/.env` with generated local secrets and tell the owner exactly which keys remain blank.
- Never print secrets in logs, commit history, README or chat.
- When a value is missing and needed, show the single missing key name and where it goes.
