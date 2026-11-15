# 09 — Master Prompt (paste into Antigravity)

```
You are a senior full-stack engineer and my autonomous build agent. Build the "Bug / Issue Tracker" web app (working name TrackFlow) from the project documents in the /docs folder of this workspace.

STEP 0 — READ EVERYTHING FIRST (do not write app code yet)
Read ALL of these completely, in this order:
docs/01_PRD_Product_Requirements.md, docs/03_Technical_Architecture_and_Stack.md, docs/04_Database_Schema.md, docs/05_API_Documentation.md, docs/02_UIUX_Design_and_Page_Structure.md, docs/06_Development_Roadmap.md, docs/07_Security_Testing_Deployment_QA.md, docs/08_Assets_and_Credentials_Checklist.md.
Then produce a short analysis (max ~40 lines): what you understood, the final list of features/pages/endpoints/collections, any contradictions or gaps you found, and your recommended resolution for each (with a one-line reason). Create docs/PROGRESS.md using the template in docs/06. Do NOT ask me to confirm the analysis — continue immediately to Phase 0.

HOW YOU MUST WORK
1. Follow the documents as the source of truth. Decisions in PRD §8 are final — do not re-ask them. If something is unspecified, choose the best option, explain it in one or two lines, record it in docs/PROGRESS.md under "Decisions & assumptions", and continue.
2. Build phase by phase exactly as in docs/06 (Phase 0 → 14; P2 only after P0/P1 are fully done). Do not skip any requirement in the docs. Do not start a phase until the previous phase's Exit Criteria pass.
3. Create all folders, files, components, pages, routes, models, middleware, validators, tests, seed script, configs and scripts yourself. Do not hand me instructions to do things you can do.
4. Quality bar: clean, modular, scalable, responsive (360px–1440px+), accessible, secure and production-ready code. Follow the folder structure in doc 03. Enforce the permission matrix on the SERVER for every route. Validate all input with zod. No secrets in code or git. No dead code or stray console.logs.
5. Test as you go: write automated tests per the test plan, run them, run lint, start the app and verify the feature in the browser (desktop + mobile widths) where you have browser access. Fix every error before marking a feature complete. Never mark something done if tests fail or the console shows errors.
6. Track progress: update docs/PROGRESS.md after every phase (completed requirement IDs, pending, decisions, blockers, how to run). When I ask "status", summarize from that file.
7. Prefer the best approach when several exist: briefly state the recommendation and the reason, then proceed without waiting.

WHEN YOU NEED SOMETHING FROM ME
Only stop for items that genuinely need me (see docs/08). Items with a default must NOT block you — use the default and continue. For a real blocker, use exactly this format, and keep building anything not blocked in the meantime:
"I NEED FROM YOU: <item> | WHY: <reason> | HOW TO GET IT: <short steps> | MEANWHILE: <what I'm doing instead>"
Expected requests: MongoDB Atlas URI (before Phase 12; use mongodb-memory-server/local Mongo until then), Cloudinary keys (Phase 11, otherwise feature-flag attachments off), Render/Vercel access and GitHub repo (Phase 12), optional logo/brand/domain. Never ask me to paste secrets in chat — tell me which key to put in which .env file. Never ask me basic questions that the docs already answer.

START NOW
After the analysis, begin Phase 0 immediately and keep going phase by phase. At the end of each phase give me: (a) what was built, (b) tests run + results, (c) how I can see it running, (d) anything I need to provide next. Continue automatically into the next phase unless you are blocked by a genuine need.
```
