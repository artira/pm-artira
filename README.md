# Cohort PM — Ship together

Project management platform for the Hult Cohort Developer Program Summer Pilot 2026.

**Production URL:** https://pm-artira-azure.vercel.app

## Architecture

```
Next.js 15 (App Router) + Tailwind CSS
         ↓
   Supabase Auth (email/password)
         ↓
   Supabase Postgres (profiles, projects, tasks, comments, notifications)
         ↓
   Row Level Security + DB triggers (auto-profile, auto-points, auto-timestamps)
         ↓
   Vercel (production deploy)
```

## Setup (fresh clone)

1. Clone and install:
   ```bash
   git clone <repo-url> && cd pm-artira
   npm install
   ```

2. Create a Supabase project at https://supabase.com (free tier)

3. In Supabase Dashboard → SQL Editor, run the contents of `supabase/schema.sql`

4. In Supabase Dashboard → Authentication → Settings:
   - Disable "Confirm email" (for frictionless reviewer signup)

5. Copy `.env.example` to `.env.local` and fill in your Supabase URL + anon key:
   ```bash
   cp .env.example .env.local
   ```

6. Run locally:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 — sign up, create a project, add tasks.

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as env vars
3. Deploy

## Features

**Baseline (all implemented):**
- Projects: create, edit, archive
- Tasks: create with title, description, status, assignee, priority, due date
- Status workflow: To Do → In Progress → Done (3 states, drag-and-drop)
- Assignment: assign any task to any cohort member
- Multi-user auth: email/password signup (supports 30+ accounts)
- Task list views: filter by project, assignee, status
- Deployment: public HTTPS with persistent Supabase data

**Differentiating:**
- Due dates with overdue badges
- Comments on tasks
- In-app notifications (bell icon)
- Points system + leaderboard (low=10, medium=25, high=50 pts)
- Progress bars per project
- Dashboard with completion rate
- Dark mode (auto via system preference)
- Mobile responsive
- Drag-and-drop kanban board

## Known limitations

- No email notifications (in-app only)
- No GitHub issue/PR linking
- No review/vote module (backlog for future projects)
- Dark mode follows system preference only (no manual toggle)

## Agent usage

See [AGENTS.md](AGENTS.md) for repository map and conventions.
