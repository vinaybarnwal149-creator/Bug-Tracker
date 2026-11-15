# TrackFlow — Demo Script (2–3 Minutes)

This walkthrough script outlines how to demonstrate all core features of TrackFlow for recording or presentation.

---

### Step 1: Introduction & Landing Page (0:00 – 0:15)
- Open `http://localhost:5173`.
- Highlight hero: "Track bugs. Manage issues. Ship faster."
- Showcase clean UI styling, responsive navigation, and core feature cards (Kanban, RBAC, Threaded Discussions).

### Step 2: Authentication & Quick Demo Login (0:15 – 0:35)
- Click **Sign In**.
- Point out the demo account quick-fill buttons:
  - Click **Alex (Owner)** to autofill `owner@demo.com`.
  - Click **Sign In**.
- Verify seamless redirect to `/dashboard`.
- Point out session persistence (JWT memory + rotating `httpOnly` refresh cookie).

### Step 3: Dashboard Overview & Project Navigation (0:35 – 0:55)
- Show personalized greeting header: "Welcome back, Alex 👋".
- Tour metric cards: Active Projects, To Do, In Progress, Completed.
- Click on **Website Revamp (WEB)** project card.

### Step 4: Interactive Kanban Drag-and-Drop (0:55 – 1:25)
- Point out three fixed columns: **To Do**, **In Progress**, **Done** with real-time ticket counters.
- Drag a ticket from **To Do** into **In Progress**:
  - Show smooth drag overlay, drop indicators, and optimistic instant placement.
  - Refresh the page to demonstrate that the new column and position persisted to the database.
- Click "+ Add ticket" on the **In Progress** column:
  - Fill title: "Refactor API authentication middleware".
  - Select priority **High**, type **Task**, and assign to **Devin**.
  - Submit: verify card instantly appears with key `WEB-9`.

### Step 5: Filtering, Search & URL Synchronization (1:25 – 1:45)
- Type in the search box: `Safari` (debounced 300ms).
- Notice that cards filter instantly and the browser URL updates with `?q=Safari`.
- Switch view from **Board** to **List** view:
  - Show the responsive, sortable table.
  - Clear filters using the "Clear" button.

### Step 6: Threaded Comments & Permissions (1:45 – 2:15)
- Click on `WEB-1` to open the **TicketDetailDrawer**.
- Point out ticket properties: priority, status, assignee, and dates.
- Scroll down to the **Comments** section:
  - Add a comment: "Reproduced in staging environment."
  - Reply to Morgan's comment: "Fix tested and verified."
  - Highlight the clean 1-level reply indent with left accent border.

### Step 7: RBAC Demonstration (2:15 – 2:40)
- Navigate to **Settings** -> **Members** tab.
- Show project team members: Alex (Owner), Morgan (Manager), Devin (Developer), Val (Viewer).
- Log out and log in as **Val (Viewer)** (`viewer@demo.com`):
  - Notice cards are non-draggable.
  - Notice "+ New Ticket" and delete buttons are cleanly disabled.
  - Server returns 403 if direct API calls are attempted.

### Step 8: Wrap-up & Tech Summary (2:40 – 3:00)
- Highlight full-stack MERN + Vite architecture, clean test coverage (17 automated tests passing), and production readiness.
