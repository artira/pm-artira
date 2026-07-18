-- ============================================
-- SEED DATA: 10 demo users, 3 projects, 30 tasks
-- Run AFTER schema.sql in the Supabase SQL Editor
-- ============================================

-- Step 1: Create demo users in auth.users
-- (Supabase trigger will auto-create profiles)
-- Password for all: 'demo1234'

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES
  ('a0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'alex.chen@demo.cohort', crypt('demo1234', gen_salt('bf')), now(), '{"display_name":"Alex Chen"}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
  ('a0000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'priya.sharma@demo.cohort', crypt('demo1234', gen_salt('bf')), now(), '{"display_name":"Priya Sharma"}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
  ('a0000001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'marcus.johnson@demo.cohort', crypt('demo1234', gen_salt('bf')), now(), '{"display_name":"Marcus Johnson"}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
  ('a0000001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'sofia.martinez@demo.cohort', crypt('demo1234', gen_salt('bf')), now(), '{"display_name":"Sofia Martinez"}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
  ('a0000001-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'james.wilson@demo.cohort', crypt('demo1234', gen_salt('bf')), now(), '{"display_name":"James Wilson"}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
  ('a0000001-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'yuki.tanaka@demo.cohort', crypt('demo1234', gen_salt('bf')), now(), '{"display_name":"Yuki Tanaka"}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
  ('a0000001-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'olivia.brown@demo.cohort', crypt('demo1234', gen_salt('bf')), now(), '{"display_name":"Olivia Brown"}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
  ('a0000001-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'diego.lopez@demo.cohort', crypt('demo1234', gen_salt('bf')), now(), '{"display_name":"Diego Lopez"}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
  ('a0000001-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'emma.davis@demo.cohort', crypt('demo1234', gen_salt('bf')), now(), '{"display_name":"Emma Davis"}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
  ('a0000001-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'raj.patel@demo.cohort', crypt('demo1234', gen_salt('bf')), now(), '{"display_name":"Raj Patel"}'::jsonb, now(), now(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Step 2: Manually set points on profiles (simulating completed work)
UPDATE public.profiles SET points = 275 WHERE id = 'a0000001-0000-0000-0000-000000000001';
UPDATE public.profiles SET points = 310 WHERE id = 'a0000001-0000-0000-0000-000000000002';
UPDATE public.profiles SET points = 185 WHERE id = 'a0000001-0000-0000-0000-000000000003';
UPDATE public.profiles SET points = 420 WHERE id = 'a0000001-0000-0000-0000-000000000004';
UPDATE public.profiles SET points = 150 WHERE id = 'a0000001-0000-0000-0000-000000000005';
UPDATE public.profiles SET points = 345 WHERE id = 'a0000001-0000-0000-0000-000000000006';
UPDATE public.profiles SET points = 95  WHERE id = 'a0000001-0000-0000-0000-000000000007';
UPDATE public.profiles SET points = 225 WHERE id = 'a0000001-0000-0000-0000-000000000008';
UPDATE public.profiles SET points = 130 WHERE id = 'a0000001-0000-0000-0000-000000000009';
UPDATE public.profiles SET points = 200 WHERE id = 'a0000001-0000-0000-0000-000000000010';

-- Step 3: Create 3 demo projects
INSERT INTO public.projects (id, name, description, owner_id, target_date, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'PM Platform', 'Build the cohort project management tool', 'a0000001-0000-0000-0000-000000000004', (now() + interval '14 days')::date, now() - interval '5 days'),
  ('b0000001-0000-0000-0000-000000000002', 'Comms Platform', 'Real-time chat and notification system for the cohort', 'a0000001-0000-0000-0000-000000000002', (now() + interval '21 days')::date, now() - interval '3 days'),
  ('b0000001-0000-0000-0000-000000000003', 'Public Showcase', 'Portfolio and achievement display for external stakeholders', 'a0000001-0000-0000-0000-000000000006', (now() + interval '30 days')::date, now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- Step 4: Create 30 tasks across projects with varied statuses
INSERT INTO public.tasks (id, project_id, title, description, status, assignee_id, creator_id, priority, due_date, completed_at, created_at) VALUES
  -- PM Platform tasks
  ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Set up Supabase schema and RLS', 'Create tables, policies, and triggers', 'done', 'a0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', 'high', (now() - interval '2 days')::date, now() - interval '1 day', now() - interval '5 days'),
  ('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', 'Build auth flow (signup/login)', 'Email + password with Supabase Auth', 'done', 'a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004', 'high', (now() - interval '1 day')::date, now() - interval '12 hours', now() - interval '4 days'),
  ('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001', 'Kanban board with drag-and-drop', 'Three columns: todo, in progress, done', 'done', 'a0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000004', 'high', (now())::date, now() - interval '6 hours', now() - interval '3 days'),
  ('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000001', 'Leaderboard with points system', 'Award points on task completion', 'done', 'a0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000004', 'medium', (now() + interval '1 day')::date, now() - interval '3 hours', now() - interval '2 days'),
  ('c0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000001', 'Add notification bell', 'In-app notifications for assignments', 'in_progress', 'a0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'medium', (now() + interval '2 days')::date, null, now() - interval '1 day'),
  ('c0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000001', 'Mobile responsive layout', 'Hamburger menu, stacked columns', 'in_progress', 'a0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000004', 'medium', (now() + interval '3 days')::date, null, now() - interval '1 day'),
  ('c0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000001', 'Dark mode toggle', 'System / light / dark cycling', 'done', 'a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004', 'low', (now() + interval '4 days')::date, now() - interval '2 hours', now() - interval '1 day'),
  ('c0000001-0000-0000-0000-000000000008', 'b0000001-0000-0000-0000-000000000001', 'Task comments feature', 'Threaded comments per task', 'todo', 'a0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000004', 'low', (now() + interval '5 days')::date, null, now()),
  ('c0000001-0000-0000-0000-000000000009', 'b0000001-0000-0000-0000-000000000001', 'GitHub PR linking', 'Link tasks to pull requests', 'todo', 'a0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000004', 'medium', (now() + interval '7 days')::date, null, now()),
  ('c0000001-0000-0000-0000-000000000010', 'b0000001-0000-0000-0000-000000000001', 'Deploy to Vercel', 'Production deployment with env vars', 'done', 'a0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', 'high', (now() - interval '1 day')::date, now() - interval '5 hours', now() - interval '2 days'),

  -- Comms Platform tasks
  ('c0000001-0000-0000-0000-000000000011', 'b0000001-0000-0000-0000-000000000002', 'Design message schema', 'Channels, DMs, threads', 'done', 'a0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'high', (now() - interval '1 day')::date, now() - interval '18 hours', now() - interval '3 days'),
  ('c0000001-0000-0000-0000-000000000012', 'b0000001-0000-0000-0000-000000000002', 'Supabase Realtime integration', 'Live message delivery', 'in_progress', 'a0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'high', (now() + interval '3 days')::date, null, now() - interval '2 days'),
  ('c0000001-0000-0000-0000-000000000013', 'b0000001-0000-0000-0000-000000000002', 'Channel creation UI', 'Create and join channels', 'in_progress', 'a0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000002', 'medium', (now() + interval '4 days')::date, null, now() - interval '1 day'),
  ('c0000001-0000-0000-0000-000000000014', 'b0000001-0000-0000-0000-000000000002', 'Emoji reactions', 'React to messages with emoji', 'todo', 'a0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000002', 'low', (now() + interval '10 days')::date, null, now()),
  ('c0000001-0000-0000-0000-000000000015', 'b0000001-0000-0000-0000-000000000002', 'File uploads in chat', 'Images and documents', 'todo', 'a0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000002', 'medium', (now() + interval '8 days')::date, null, now()),
  ('c0000001-0000-0000-0000-000000000016', 'b0000001-0000-0000-0000-000000000002', 'Typing indicators', 'Show who is typing', 'todo', 'a0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000002', 'low', (now() + interval '12 days')::date, null, now()),
  ('c0000001-0000-0000-0000-000000000017', 'b0000001-0000-0000-0000-000000000002', 'Unread message counts', 'Badge on channels with unread', 'todo', 'a0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000002', 'medium', (now() + interval '6 days')::date, null, now()),
  ('c0000001-0000-0000-0000-000000000018', 'b0000001-0000-0000-0000-000000000002', 'PM integration webhook', 'Post task updates to channels', 'todo', 'a0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000002', 'high', (now() + interval '5 days')::date, null, now()),
  ('c0000001-0000-0000-0000-000000000019', 'b0000001-0000-0000-0000-000000000002', 'Search messages', 'Full-text search across channels', 'todo', 'a0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000002', 'low', (now() + interval '14 days')::date, null, now()),
  ('c0000001-0000-0000-0000-000000000020', 'b0000001-0000-0000-0000-000000000002', 'Deploy comms to production', 'Vercel deployment with Realtime', 'todo', 'a0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'high', (now() + interval '7 days')::date, null, now()),

  -- Public Showcase tasks
  ('c0000001-0000-0000-0000-000000000021', 'b0000001-0000-0000-0000-000000000003', 'Design portfolio layout', 'Card grid with project previews', 'done', 'a0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000006', 'high', (now())::date, now() - interval '4 hours', now() - interval '1 day'),
  ('c0000001-0000-0000-0000-000000000022', 'b0000001-0000-0000-0000-000000000003', 'GitHub stats integration', 'Pull commit counts and PR stats', 'in_progress', 'a0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000006', 'medium', (now() + interval '5 days')::date, null, now()),
  ('c0000001-0000-0000-0000-000000000023', 'b0000001-0000-0000-0000-000000000003', 'Member profile pages', 'Bio, skills, achievements', 'in_progress', 'a0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000006', 'medium', (now() + interval '6 days')::date, null, now()),
  ('c0000001-0000-0000-0000-000000000024', 'b0000001-0000-0000-0000-000000000003', 'Achievement badges system', 'Unlockable badges for milestones', 'todo', 'a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'low', (now() + interval '15 days')::date, null, now()),
  ('c0000001-0000-0000-0000-000000000025', 'b0000001-0000-0000-0000-000000000003', 'Project demo videos', 'Embed Loom or YouTube demos', 'todo', 'a0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000006', 'low', (now() + interval '20 days')::date, null, now()),
  ('c0000001-0000-0000-0000-000000000026', 'b0000001-0000-0000-0000-000000000003', 'SEO and OG images', 'Meta tags and social previews', 'todo', 'a0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000006', 'medium', (now() + interval '10 days')::date, null, now()),
  ('c0000001-0000-0000-0000-000000000027', 'b0000001-0000-0000-0000-000000000003', 'Cohort timeline visualization', 'Interactive timeline of the pilot', 'todo', 'a0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000006', 'medium', (now() + interval '12 days')::date, null, now()),
  ('c0000001-0000-0000-0000-000000000028', 'b0000001-0000-0000-0000-000000000003', 'Testimonials section', 'Peer quotes and reviews', 'todo', 'a0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000006', 'low', (now() + interval '18 days')::date, null, now()),
  ('c0000001-0000-0000-0000-000000000029', 'b0000001-0000-0000-0000-000000000003', 'Mobile-first responsive', 'Works great on phone screens', 'todo', 'a0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000006', 'medium', (now() + interval '8 days')::date, null, now()),
  ('c0000001-0000-0000-0000-000000000030', 'b0000001-0000-0000-0000-000000000003', 'Launch showcase site', 'Final deploy and DNS setup', 'todo', 'a0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000006', 'high', (now() + interval '25 days')::date, null, now())
ON CONFLICT (id) DO NOTHING;

-- Step 5: Add some notifications
INSERT INTO public.notifications (user_id, message, link, read) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Sofia assigned you: "Build auth flow"', '/board', true),
  ('a0000001-0000-0000-0000-000000000001', 'Yuki assigned you: "Achievement badges system"', '/board', false),
  ('a0000001-0000-0000-0000-000000000002', 'Sofia assigned you: "Kanban board with drag-and-drop"', '/board', true),
  ('a0000001-0000-0000-0000-000000000003', 'Sofia assigned you: "Add notification bell"', '/board', false),
  ('a0000001-0000-0000-0000-000000000005', 'Sofia assigned you: "Task comments feature"', '/board', false),
  ('a0000001-0000-0000-0000-000000000006', 'Sofia assigned you: "Leaderboard with points system"', '/board', true),
  ('a0000001-0000-0000-0000-000000000008', 'Sofia assigned you: "Mobile responsive layout"', '/board', false),
  ('a0000001-0000-0000-0000-000000000010', 'Priya assigned you: "PM integration webhook"', '/board', false);

-- Step 6: Add some comments
INSERT INTO public.comments (task_id, author_id, body) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004', 'Schema is live — RLS tested with 3 roles.'),
  ('c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 'Nice! The trigger for auto-profile is a great touch.'),
  ('c0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000002', 'Drag-and-drop is working but needs a smoother animation.'),
  ('c0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000003', 'Working on the bell icon — should I add sound?'),
  ('c0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000004', 'No sound — just a badge count is fine for v1.'),
  ('c0000001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000002', 'Realtime is tricky with RLS — need to set up broadcast.'),
  ('c0000001-0000-0000-0000-000000000021', 'a0000001-0000-0000-0000-000000000006', 'Going with a bento grid layout — looks modern.'),
  ('c0000001-0000-0000-0000-000000000021', 'a0000001-0000-0000-0000-000000000001', 'Love it! Maybe add a dark mode variant too.');
