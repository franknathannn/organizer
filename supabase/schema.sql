-- Campus OS schema
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query)

-- ============================================================
-- 1. BUDGET: transactions ledger. Balance is derived, not stored,
--    so it can never drift out of sync.
-- ============================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null,           -- positive = money in, negative = money spent
  label text not null,                      -- what it was for
  category text default 'general',
  occurred_on date not null default current_date,
  planner_event_id uuid,                    -- optional link back to a date-planner event
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on public.transactions
  for insert with check (auth.uid() = user_id);
create policy "transactions_update_own" on public.transactions
  for update using (auth.uid() = user_id);
create policy "transactions_delete_own" on public.transactions
  for delete using (auth.uid() = user_id);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, occurred_on desc);

-- ============================================================
-- 2. TODOS: four-column board (urgency lanes) + completion state
-- ============================================================
create type public.todo_urgency as enum ('urgent', 'will_become_urgent', 'not_urgent', 'accomplished');

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  notes text,
  urgency public.todo_urgency not null default 'not_urgent',
  due_date date,
  is_done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.todos enable row level security;

create policy "todos_select_own" on public.todos
  for select using (auth.uid() = user_id);
create policy "todos_insert_own" on public.todos
  for insert with check (auth.uid() = user_id);
create policy "todos_update_own" on public.todos
  for update using (auth.uid() = user_id);
create policy "todos_delete_own" on public.todos
  for delete using (auth.uid() = user_id);

create index if not exists todos_user_urgency_idx on public.todos (user_id, urgency);

-- Keep is_done / done_at / urgency in sync with each other automatically
create or replace function public.sync_todo_completion()
returns trigger as $$
begin
  if new.urgency = 'accomplished' and old.urgency is distinct from 'accomplished' then
    new.is_done := true;
    new.done_at := now();
  elsif new.urgency <> 'accomplished' and old.urgency = 'accomplished' then
    new.is_done := false;
    new.done_at := null;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists todos_sync_completion on public.todos;
create trigger todos_sync_completion
  before update on public.todos
  for each row execute function public.sync_todo_completion();

-- ============================================================
-- 3. DATE PLANNER: calendar events, optionally tied to a budget spend
-- ============================================================
create table if not exists public.planner_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  event_date date not null,
  event_time time,
  planned_spend numeric(12,2) default 0,
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.planner_events enable row level security;

create policy "planner_events_select_own" on public.planner_events
  for select using (auth.uid() = user_id);
create policy "planner_events_insert_own" on public.planner_events
  for insert with check (auth.uid() = user_id);
create policy "planner_events_update_own" on public.planner_events
  for update using (auth.uid() = user_id);
create policy "planner_events_delete_own" on public.planner_events
  for delete using (auth.uid() = user_id);

create index if not exists planner_events_user_date_idx
  on public.planner_events (user_id, event_date);

-- ============================================================
-- 4. DEADLINES: things to finish by a certain date
-- ============================================================
create table if not exists public.deadlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  notes text,
  due_date date not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.deadlines enable row level security;

create policy "deadlines_select_own" on public.deadlines
  for select using (auth.uid() = user_id);
create policy "deadlines_insert_own" on public.deadlines
  for insert with check (auth.uid() = user_id);
create policy "deadlines_update_own" on public.deadlines
  for update using (auth.uid() = user_id);
create policy "deadlines_delete_own" on public.deadlines
  for delete using (auth.uid() = user_id);

create index if not exists deadlines_user_due_idx on public.deadlines (user_id, due_date);

-- ============================================================
-- 5. GOALS: bonus progress-bar tracker ("2 of 4 tasks done = 50%")
-- ============================================================
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_count int not null default 1 check (target_count > 0),
  current_count int not null default 0 check (current_count >= 0),
  created_at timestamptz not null default now()
);

alter table public.goals enable row level security;

create policy "goals_select_own" on public.goals
  for select using (auth.uid() = user_id);
create policy "goals_insert_own" on public.goals
  for insert with check (auth.uid() = user_id);
create policy "goals_update_own" on public.goals
  for update using (auth.uid() = user_id);
create policy "goals_delete_own" on public.goals
  for delete using (auth.uid() = user_id);

-- Clamp current_count to target_count so the bar never exceeds 100%
create or replace function public.clamp_goal_progress()
returns trigger as $$
begin
  if new.current_count > new.target_count then
    new.current_count := new.target_count;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists goals_clamp_progress on public.goals;
create trigger goals_clamp_progress
  before insert or update on public.goals
  for each row execute function public.clamp_goal_progress();
