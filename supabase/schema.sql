-- Profiles (auto-created on signup via trigger)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  points integer default 0,
  created_at timestamptz default now()
);

-- Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  target_date date,
  archived boolean default false,
  created_at timestamptz default now()
);

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  assignee_id uuid references public.profiles(id) on delete set null,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Comments on tasks
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;

-- Profiles: everyone can read, users can update own
create policy "profiles_read" on public.profiles for select using (true);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);

-- Projects: everyone can read, owner can insert/update/delete
create policy "projects_read" on public.projects for select using (true);
create policy "projects_insert" on public.projects for insert with check (auth.uid() = owner_id);
create policy "projects_update" on public.projects for update using (auth.uid() = owner_id);
create policy "projects_delete" on public.projects for delete using (auth.uid() = owner_id);

-- Tasks: everyone can read, creator/assignee can update, creator can insert/delete
create policy "tasks_read" on public.tasks for select using (true);
create policy "tasks_insert" on public.tasks for insert with check (auth.uid() = creator_id);
create policy "tasks_update" on public.tasks for update using (
  auth.uid() = creator_id or auth.uid() = assignee_id
);
create policy "tasks_delete" on public.tasks for delete using (auth.uid() = creator_id);

-- Comments: everyone can read, author can insert
create policy "comments_read" on public.comments for select using (true);
create policy "comments_insert" on public.comments for insert with check (auth.uid() = author_id);

-- Notifications: user can read/update own
create policy "notifications_read" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_update" on public.notifications for update using (auth.uid() = user_id);
create policy "notifications_insert" on public.notifications for insert with check (auth.uid() is not null);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at on tasks
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.update_updated_at();

-- Award points when task marked done
create or replace function public.award_points_on_complete()
returns trigger as $$
begin
  if new.status = 'done' and old.status != 'done' and new.assignee_id is not null then
    new.completed_at = now();
    update public.profiles
    set points = points + case new.priority
      when 'low' then 10
      when 'medium' then 25
      when 'high' then 50
      else 25
    end
    where id = new.assignee_id;
  end if;
  if new.status != 'done' and old.status = 'done' then
    new.completed_at = null;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tasks_award_points on public.tasks;
create trigger tasks_award_points
  before update on public.tasks
  for each row execute function public.award_points_on_complete();
