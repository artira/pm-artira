# Cohort PM — Ship together

Project management platform for the Hult Cohort Developer Program Summer Pilot 2026.

**Production URL:** https://pm-artira-azure.vercel.app

**Demo login:** `sofia.martinez@demo.cohort` / `demo1234` (project owner, top scorer)

## Features

**Core PM:**
- Projects: create, edit, archive with progress bars and deadline countdowns
- Tasks: title, description, status, assignee, priority, due dates, comments
- Kanban board: drag-and-drop across To Do → In Progress → Done
- Assignment: assign any task to any cohort member
- Multi-user auth: email/password signup (30+ accounts supported)
- Filters: by project and assignee

**Role-based permissions:**
- Project owners: full CRUD — create tasks, assign, edit all fields, delete
- Assignees: update status only on their own tasks (drag or dropdown)
- Everyone else: read-only view

**Motivation & engagement:**
- Points system: 10 / 25 / 50 pts for completing low / medium / high priority tasks
- Leaderboard with podium (gold/silver/bronze) for top 3 and progress bars for all
- Dashboard with gradient hero stats, SVG donut chart, priority bar chart, cohort progress
- In-app notifications on task assignment
- Due date badges with color-coded urgency
- Per-project progress bars with completion percentages

**Visual design:**
- Vivid color palette (purple, teal, pink, orange gradients)
- Dark mode toggle: System / Light / Dark (persisted in localStorage)
- Mobile responsive with hamburger nav

## Architecture

```
Next.js 16 (App Router) + Tailwind CSS
         ↓
   Supabase Auth (email/password)
         ↓
   Supabase Postgres
   ├─ profiles (auto-created via trigger)
   ├─ projects (owner-gated RLS)
   ├─ tasks (owner CRUD + assignee status updates)
   ├─ comments (authenticated insert)
   └─ notifications (per-user read/write)
         ↓
   Row Level Security + DB triggers
   ├─ handle_new_user → auto-create profile on signup
   ├─ award_points_on_complete → 10/25/50 pts by priority
   └─ update_updated_at → auto-timestamp
         ↓
   Vercel (production deploy)
```

## Setup (fresh clone)

1. Clone and install:
   ```bash
   git clone https://github.com/artira/pm-artira.git && cd pm-artira
   npm install
   ```

2. Create a Supabase project at https://supabase.com (free tier)

3. In Supabase SQL Editor, run `supabase/schema.sql`

4. Copy `.env.example` → `.env.local` and fill in your Supabase URL + anon key

5. (Optional) Seed demo data — 10 users, 3 projects, 30 tasks:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your-key node supabase/seed.mjs
   ```

6. Run locally:
   ```bash
   npm run dev
   ```

## Demo accounts

All demo users use password `demo1234`:

| User | Role | Points |
|------|------|--------|
| sofia.martinez@demo.cohort | Owner: PM Platform | 420 |
| yuki.tanaka@demo.cohort | Owner: Public Showcase | 345 |
| priya.sharma@demo.cohort | Owner: Comms Platform | 310 |
| alex.chen@demo.cohort | Assignee | 275 |
| diego.lopez@demo.cohort | Assignee | 225 |
| raj.patel@demo.cohort | Assignee | 200 |
| marcus.johnson@demo.cohort | Assignee | 185 |
| james.wilson@demo.cohort | Assignee | 150 |
| emma.davis@demo.cohort | Assignee | 130 |
| olivia.brown@demo.cohort | Assignee | 95 |

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

## Known limitations

- No email notifications (in-app only)
- No GitHub issue/PR linking
- No review/vote module
- No load testing performed

## Agent usage

See [AGENTS.md](AGENTS.md) for repository map and conventions.
