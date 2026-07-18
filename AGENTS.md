# AGENTS.md — Cohort PM

## Repository map

```
src/
  app/
    auth/page.tsx        — sign in / sign up (email + password)
    dashboard/page.tsx   — hero stats, SVG donut chart, priority bars, cohort progress
    projects/page.tsx    — create / edit / archive projects with progress bars
    board/page.tsx       — kanban board with role-based permissions (owner vs assignee)
    leaderboard/page.tsx — podium (gold/silver/bronze) + ranked list with progress bars
    layout.tsx           — root layout with AuthProvider
    page.tsx             — redirects to /dashboard or /auth
    globals.css          — vivid design tokens (light + dark mode)
  lib/
    supabase.ts          — Supabase client
    auth-context.tsx     — auth state, sign in/up/out, profile
  components/
    Shell.tsx            — top nav, dark mode toggle, notification bell, mobile responsive
supabase/
  schema.sql             — database schema, RLS policies, triggers
  seed.mjs               — demo data: 10 users, 3 projects, 30 tasks, comments, notifications
```

## Data model

- **profiles** — auto-created on signup via trigger; tracks points
- **projects** — owned by a user; owner has full task management rights
- **tasks** — belongs to a project; status (todo/in_progress/done), assignee, priority, due date
- **comments** — threaded on tasks; any authenticated user can post
- **notifications** — per-user, with read status

## Permission model

- **Project owner** — full CRUD on tasks within their projects (create, edit, assign, delete)
- **Assignee** — can update status on tasks assigned to them (drag-and-drop or dropdown)
- **Everyone else** — read-only; can view all tasks and post comments
- Enforced at both DB level (RLS policies) and UI level (conditional controls)

## Key conventions

- All styling uses CSS custom properties (var(--*)) for light/dark theming
- Vivid gradient palette: purple, teal, pink, orange
- Points awarded via DB trigger: low=10, medium=25, high=50
- Drag-and-drop respects permissions — only owner/assignee can move cards
- Dark mode: system/light/dark cycling via localStorage
