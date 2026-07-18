// Run: node supabase/seed.mjs
// Creates 10 demo users and populates projects/tasks

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://stenzpgtvuahczveatns.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('\n❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  console.error('Find it in Supabase Dashboard → Settings → API → service_role key');
  console.error('Run: SUPABASE_SERVICE_ROLE_KEY=your-key node supabase/seed.mjs\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DEMO_USERS = [
  { email: 'alex.chen@demo.cohort', name: 'Alex Chen', points: 275 },
  { email: 'priya.sharma@demo.cohort', name: 'Priya Sharma', points: 310 },
  { email: 'marcus.johnson@demo.cohort', name: 'Marcus Johnson', points: 185 },
  { email: 'sofia.martinez@demo.cohort', name: 'Sofia Martinez', points: 420 },
  { email: 'james.wilson@demo.cohort', name: 'James Wilson', points: 150 },
  { email: 'yuki.tanaka@demo.cohort', name: 'Yuki Tanaka', points: 345 },
  { email: 'olivia.brown@demo.cohort', name: 'Olivia Brown', points: 95 },
  { email: 'diego.lopez@demo.cohort', name: 'Diego Lopez', points: 225 },
  { email: 'emma.davis@demo.cohort', name: 'Emma Davis', points: 130 },
  { email: 'raj.patel@demo.cohort', name: 'Raj Patel', points: 200 },
];

const PASSWORD = 'demo1234';

async function seed() {
  console.log('🌱 Seeding demo data...\n');

  // 1. Create users via admin API
  const userIds = [];
  for (const u of DEMO_USERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: u.name },
    });

    if (error) {
      if (error.message.includes('already been registered')) {
        // User exists — fetch their ID
        const { data: list } = await supabase.auth.admin.listUsers();
        const existing = list?.users?.find((x) => x.email === u.email);
        if (existing) {
          userIds.push(existing.id);
          console.log(`  ⏭ ${u.name} already exists`);
        }
      } else {
        console.error(`  ❌ ${u.name}: ${error.message}`);
        userIds.push(null);
      }
    } else {
      userIds.push(data.user.id);
      console.log(`  ✅ ${u.name} created`);
    }
  }

  // 2. Set points on profiles
  for (let i = 0; i < DEMO_USERS.length; i++) {
    if (!userIds[i]) continue;
    await supabase.from('profiles').update({ points: DEMO_USERS[i].points }).eq('id', userIds[i]);
  }
  console.log('\n📊 Points set on profiles');

  // 3. Create projects (owned by Sofia, Priya, Yuki)
  const sofia = userIds[3];
  const priya = userIds[1];
  const yuki = userIds[5];

  if (!sofia || !priya || !yuki) {
    console.error('❌ Missing key users, cannot create projects');
    return;
  }

  const projects = [
    { name: 'PM Platform', description: 'Build the cohort project management tool', owner_id: sofia, target_date: futureDate(14) },
    { name: 'Comms Platform', description: 'Real-time chat and notification system', owner_id: priya, target_date: futureDate(21) },
    { name: 'Public Showcase', description: 'Portfolio and achievement display', owner_id: yuki, target_date: futureDate(30) },
  ];

  const { data: insertedProjects, error: pErr } = await supabase.from('projects').insert(projects).select();
  if (pErr) {
    console.error('❌ Projects:', pErr.message);
    return;
  }
  console.log(`📁 ${insertedProjects.length} projects created`);

  const [pmId, commsId, showcaseId] = insertedProjects.map((p) => p.id);

  // 4. Create tasks
  const tasks = [
    // PM Platform (10 tasks)
    { project_id: pmId, title: 'Set up Supabase schema and RLS', description: 'Create tables, policies, and triggers', status: 'done', assignee_id: userIds[3], creator_id: sofia, priority: 'high', due_date: pastDate(2), completed_at: pastTimestamp(1) },
    { project_id: pmId, title: 'Build auth flow (signup/login)', description: 'Email + password with Supabase Auth', status: 'done', assignee_id: userIds[0], creator_id: sofia, priority: 'high', due_date: pastDate(1), completed_at: pastTimestamp(0.5) },
    { project_id: pmId, title: 'Kanban board with drag-and-drop', description: 'Three columns: todo, in progress, done', status: 'done', assignee_id: userIds[1], creator_id: sofia, priority: 'high', due_date: todayStr(), completed_at: pastTimestamp(0.25) },
    { project_id: pmId, title: 'Leaderboard with points system', description: 'Award points on task completion by priority', status: 'done', assignee_id: userIds[5], creator_id: sofia, priority: 'medium', due_date: futureDate(1), completed_at: pastTimestamp(0.1) },
    { project_id: pmId, title: 'Add notification bell', description: 'In-app notifications for task assignments', status: 'in_progress', assignee_id: userIds[2], creator_id: sofia, priority: 'medium', due_date: futureDate(2) },
    { project_id: pmId, title: 'Mobile responsive layout', description: 'Hamburger menu, stacked columns on small screens', status: 'in_progress', assignee_id: userIds[7], creator_id: sofia, priority: 'medium', due_date: futureDate(3) },
    { project_id: pmId, title: 'Dark mode toggle', description: 'System / light / dark cycling with localStorage', status: 'done', assignee_id: userIds[0], creator_id: sofia, priority: 'low', due_date: futureDate(4), completed_at: pastTimestamp(0.08) },
    { project_id: pmId, title: 'Task comments feature', description: 'Threaded comments per task', status: 'todo', assignee_id: userIds[4], creator_id: sofia, priority: 'low', due_date: futureDate(5) },
    { project_id: pmId, title: 'GitHub PR linking', description: 'Link tasks to pull requests automatically', status: 'todo', assignee_id: userIds[9], creator_id: sofia, priority: 'medium', due_date: futureDate(7) },
    { project_id: pmId, title: 'Deploy to Vercel', description: 'Production deployment with env vars', status: 'done', assignee_id: userIds[3], creator_id: sofia, priority: 'high', due_date: pastDate(1), completed_at: pastTimestamp(0.2) },

    // Comms Platform (10 tasks)
    { project_id: commsId, title: 'Design message schema', description: 'Channels, DMs, threads data model', status: 'done', assignee_id: userIds[1], creator_id: priya, priority: 'high', due_date: pastDate(1), completed_at: pastTimestamp(0.75) },
    { project_id: commsId, title: 'Supabase Realtime integration', description: 'Live message delivery via websockets', status: 'in_progress', assignee_id: userIds[1], creator_id: priya, priority: 'high', due_date: futureDate(3) },
    { project_id: commsId, title: 'Channel creation UI', description: 'Create and join public/private channels', status: 'in_progress', assignee_id: userIds[8], creator_id: priya, priority: 'medium', due_date: futureDate(4) },
    { project_id: commsId, title: 'Emoji reactions', description: 'React to messages with emoji picker', status: 'todo', assignee_id: userIds[6], creator_id: priya, priority: 'low', due_date: futureDate(10) },
    { project_id: commsId, title: 'File uploads in chat', description: 'Drag-and-drop images and documents', status: 'todo', assignee_id: userIds[2], creator_id: priya, priority: 'medium', due_date: futureDate(8) },
    { project_id: commsId, title: 'Typing indicators', description: 'Show who is currently typing', status: 'todo', assignee_id: userIds[4], creator_id: priya, priority: 'low', due_date: futureDate(12) },
    { project_id: commsId, title: 'Unread message counts', description: 'Badge count on channels with new messages', status: 'todo', assignee_id: userIds[5], creator_id: priya, priority: 'medium', due_date: futureDate(6) },
    { project_id: commsId, title: 'PM integration webhook', description: 'Auto-post task updates to project channels', status: 'todo', assignee_id: userIds[9], creator_id: priya, priority: 'high', due_date: futureDate(5) },
    { project_id: commsId, title: 'Search messages', description: 'Full-text search across all channels', status: 'todo', assignee_id: userIds[7], creator_id: priya, priority: 'low', due_date: futureDate(14) },
    { project_id: commsId, title: 'Deploy comms to production', description: 'Vercel deployment with Realtime config', status: 'todo', assignee_id: userIds[1], creator_id: priya, priority: 'high', due_date: futureDate(7) },

    // Public Showcase (10 tasks)
    { project_id: showcaseId, title: 'Design portfolio layout', description: 'Bento grid with project preview cards', status: 'done', assignee_id: userIds[5], creator_id: yuki, priority: 'high', due_date: todayStr(), completed_at: pastTimestamp(0.15) },
    { project_id: showcaseId, title: 'GitHub stats integration', description: 'Pull commit counts and PR contribution stats', status: 'in_progress', assignee_id: userIds[5], creator_id: yuki, priority: 'medium', due_date: futureDate(5) },
    { project_id: showcaseId, title: 'Member profile pages', description: 'Bio, skills, achievements per person', status: 'in_progress', assignee_id: userIds[6], creator_id: yuki, priority: 'medium', due_date: futureDate(6) },
    { project_id: showcaseId, title: 'Achievement badges system', description: 'Unlockable badges for shipping milestones', status: 'todo', assignee_id: userIds[0], creator_id: yuki, priority: 'low', due_date: futureDate(15) },
    { project_id: showcaseId, title: 'Project demo videos', description: 'Embed Loom or YouTube walkthroughs', status: 'todo', assignee_id: userIds[8], creator_id: yuki, priority: 'low', due_date: futureDate(20) },
    { project_id: showcaseId, title: 'SEO and OG images', description: 'Meta tags and social media preview cards', status: 'todo', assignee_id: userIds[3], creator_id: yuki, priority: 'medium', due_date: futureDate(10) },
    { project_id: showcaseId, title: 'Cohort timeline visualization', description: 'Interactive timeline of the 6-week pilot', status: 'todo', assignee_id: userIds[2], creator_id: yuki, priority: 'medium', due_date: futureDate(12) },
    { project_id: showcaseId, title: 'Testimonials section', description: 'Peer review quotes and endorsements', status: 'todo', assignee_id: userIds[4], creator_id: yuki, priority: 'low', due_date: futureDate(18) },
    { project_id: showcaseId, title: 'Mobile-first responsive', description: 'Optimized for phone-size viewports', status: 'todo', assignee_id: userIds[7], creator_id: yuki, priority: 'medium', due_date: futureDate(8) },
    { project_id: showcaseId, title: 'Launch showcase site', description: 'Final deploy, DNS, and go-live', status: 'todo', assignee_id: userIds[5], creator_id: yuki, priority: 'high', due_date: futureDate(25) },
  ];

  const { data: insertedTasks, error: tErr } = await supabase.from('tasks').insert(tasks).select();
  if (tErr) {
    console.error('❌ Tasks:', tErr.message);
    return;
  }
  console.log(`✅ ${insertedTasks.length} tasks created`);

  // 5. Add comments
  const taskMap = {};
  insertedTasks.forEach((t) => { taskMap[t.title] = t.id; });

  const comments = [
    { task_id: taskMap['Set up Supabase schema and RLS'], author_id: userIds[3], body: 'Schema is live — RLS tested with 3 roles. All policies passing.' },
    { task_id: taskMap['Set up Supabase schema and RLS'], author_id: userIds[1], body: 'Nice! The trigger for auto-profile creation is a great touch.' },
    { task_id: taskMap['Kanban board with drag-and-drop'], author_id: userIds[1], body: 'Drag-and-drop is working but needs smoother animation on mobile.' },
    { task_id: taskMap['Add notification bell'], author_id: userIds[2], body: 'Working on the bell icon — should I add a sound effect?' },
    { task_id: taskMap['Add notification bell'], author_id: userIds[3], body: 'No sound — just a red badge count is fine for v1.' },
    { task_id: taskMap['Supabase Realtime integration'], author_id: userIds[1], body: 'Realtime is tricky with RLS — need to configure broadcast channels.' },
    { task_id: taskMap['Design portfolio layout'], author_id: userIds[5], body: 'Going with a bento grid layout — looks clean and modern.' },
    { task_id: taskMap['Design portfolio layout'], author_id: userIds[0], body: 'Love it! Maybe add a dark mode variant too.' },
  ].filter((c) => c.task_id); // skip if task wasn't found

  if (comments.length > 0) {
    await supabase.from('comments').insert(comments);
    console.log(`💬 ${comments.length} comments added`);
  }

  // 6. Add notifications
  const notifications = [
    { user_id: userIds[0], message: 'Sofia assigned you: "Build auth flow"', link: '/board', read: true },
    { user_id: userIds[0], message: 'Yuki assigned you: "Achievement badges system"', link: '/board', read: false },
    { user_id: userIds[1], message: 'Sofia assigned you: "Kanban board with drag-and-drop"', link: '/board', read: true },
    { user_id: userIds[2], message: 'Sofia assigned you: "Add notification bell"', link: '/board', read: false },
    { user_id: userIds[4], message: 'Sofia assigned you: "Task comments feature"', link: '/board', read: false },
    { user_id: userIds[5], message: 'Sofia assigned you: "Leaderboard with points system"', link: '/board', read: true },
    { user_id: userIds[7], message: 'Sofia assigned you: "Mobile responsive layout"', link: '/board', read: false },
    { user_id: userIds[9], message: 'Priya assigned you: "PM integration webhook"', link: '/board', read: false },
  ].filter((n) => n.user_id);

  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications);
    console.log(`🔔 ${notifications.length} notifications added`);
  }

  console.log('\n✨ Seeding complete!');
  console.log(`\nDemo login: any user above with password "${PASSWORD}"`);
  console.log('Try: sofia.martinez@demo.cohort / demo1234 (top scorer)\n');
}

function pastDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function futureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function pastTimestamp(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

seed().catch(console.error);
