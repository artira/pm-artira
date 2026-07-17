# AGENTS.md — Cohort PM

## Repository map

```
src/
  app/
    auth/page.tsx        — sign in / sign up (email + password)
    dashboard/page.tsx   — personal stats, completion rate, recent tasks
    projects/page.tsx    — create / edit / archive projects with progress bars
    board/page.tsx       — kanban board (todo → in progress → done), drag-and-drop, task CRUD, comments
    leaderboard/page.tsx — cohort-wide points ranking (low/med/high priority = 10/25/50 pts)
    layout.tsx           — root layout with AuthProvider
    page.tsx             — redirects to /dashboard or /auth
    globals.css          — design tokens (light + dark mode)
  lib/
    supabase.ts          — Supabase client
    auth-context.tsx     — auth state, sign in/up/out, profile
  components/
    Shell.tsx            — top nav, notification bell, mobile responsive
supabase/
  schema.sql             — full database schema, RLS policies, triggers
```

## Data model

- **profiles** — auto-created on signup via trigger; has points
- **projects** — owned by a user, supports archive
- **tasks** — belongs to a project, has status (todo/in_progress/done), assignee, priority, due date
- **comments** — threaded on tasks
- **notifications** — per-user, with read status

## Key conventions

- All styling uses CSS custom properties (var(--*)) for light/dark theming
- Supabase RLS enforces access: creators can write, assignees can update tasks, everyone reads
- Points are awarded via DB trigger when tasks move to "done"
- Drag-and-drop on the board page changes task status
