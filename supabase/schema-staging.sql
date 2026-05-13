-- ─────────────────────────────────────────────────────────────────────────────
-- SproutAIGarden — STAGING / FRESH INSTALL Schema
-- Paste this entire file into Supabase SQL Editor and run it.
-- This is the full current state — do NOT run on production (use incremental migrations there).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Tables ─────────────────────────────────────────────────────────────────

create table if not exists profiles (
  id                    uuid        primary key references auth.users(id) on delete cascade,
  email                 text        not null unique,
  display_name          text,
  first_name            text,
  country               text        not null check (country in ('PH', 'TH')),
  is_admin              boolean     not null default false,
  is_approver           boolean     not null default false,
  has_dismissed_welcome boolean     not null default false,
  created_at            timestamptz not null default now()
);

create table if not exists projects (
  id                   bigint      primary key generated always as identity,
  country              text        not null check (country in ('PH', 'TH')),
  name                 text        not null,
  built_by             text,
  built_for            text[]      not null default '{}',
  stage                text        not null default 'seedling'
                                   check (stage in ('seedling', 'nursery', 'sprout', 'bloom', 'thriving')),
  impact_num           text,
  builder              text,
  builder_email        text        not null,
  zx                   integer     not null default 40,
  zy                   integer     not null default 50,
  notes                text[]      not null default '{}',
  milestones           text[]      not null default '{}',
  description          text,
  demo_link            text,
  interested_users     text[]      not null default '{}',
  last_updated         timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  -- Nursery review fields
  prototype_link       text,
  deck_link            text,
  review_status        text        check (review_status in ('pending', 'approved', 'needs_rework')),
  review_comment       text,
  reviewed_by          text,
  reviewed_at          timestamptz,
  submitted_at         timestamptz,
  -- Tool / stack fields
  tool_used            text[]      not null default '{}',
  collaborator_emails  text[]               default '{}',
  data_sources         text[]               default '{}',
  agentic_framework    text[]               default '{}',
  -- Story fields
  problem_space        text,
  built                text,
  better_now           text
);

create table if not exists wishes (
  id               text        primary key,  -- format: "w" + integer, e.g. "w10"
  country          text        not null check (country in ('PH', 'TH')),
  title            text        not null,
  why              text,
  built_for        text[]      not null default '{}',
  wisher_name      text,
  wisher_email     text        not null,
  upvoters         text[]      not null default '{}',
  fulfilled_by     text,                     -- project id; never delete fulfilled wishes
  claimed_by       text,
  claimed_by_email text,
  claimed_at       text,
  created_at       timestamptz not null default now()
);

create table if not exists notifications (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references profiles(id) on delete cascade,
  type       text        not null,
  payload    jsonb,
  read       boolean     not null default false,
  created_at timestamptz not null default now()
);

create table if not exists help_items (
  id           uuid        primary key default gen_random_uuid(),
  type         text        not null check (type in ('report', 'ask')),
  title        text        not null,
  description  text,
  submitted_by text        not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  status       text        not null default 'open' check (status in ('open', 'resolved', 'unanswered', 'answered')),
  resolved_by  text,
  resolved_at  timestamptz,
  upvoters     text[]      not null default '{}'
);

create table if not exists activity_log (
  id          bigint      generated always as identity primary key,
  event_type  text        not null,
  actor_email text,
  actor_name  text,
  project_id  text,
  wish_id     text,
  from_stage  text,
  to_stage    text,
  entity_name text        not null,
  created_at  timestamptz not null default now()
);

-- ── 2. Helper functions (defined after tables) ───────────────────────────────

create or replace function is_admin()
returns boolean as $$
  select coalesce(
    (select is_admin from profiles where id = auth.uid()),
    false
  );
$$ language sql security definer;

create or replace function is_approver()
returns boolean as $$
  select coalesce(
    (select is_approver from profiles where id = auth.uid()),
    false
  );
$$ language sql security definer;

-- ── 3. Triggers ───────────────────────────────────────────────────────────────

create or replace function help_items_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger help_items_updated_at
  before update on help_items
  for each row execute function help_items_set_updated_at();

-- ── 4. Withdrawal RPC ─────────────────────────────────────────────────────────

create or replace function withdraw_from_nursery(p_id uuid)
returns void as $$
begin
  if not exists (
    select 1 from projects
    where id = p_id
      and builder_email = auth.email()
      and stage = 'nursery'
      and review_status = 'pending'
  ) then
    raise exception 'Not authorized or invalid state for withdrawal';
  end if;
  update projects
    set stage = 'seedling',
        review_status = null
    where id = p_id;
end;
$$ language plpgsql security definer;

-- ── 5. Row Level Security ─────────────────────────────────────────────────────

-- profiles
alter table profiles enable row level security;
create policy "Public read"  on profiles for select using (true);
create policy "Own insert"   on profiles for insert with check (auth.uid() = id);
create policy "Own update"   on profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- projects
alter table projects enable row level security;
create policy "Authenticated read"   on projects for select
  using (auth.role() = 'authenticated');
create policy "Any user insert"      on projects for insert
  with check (auth.role() = 'authenticated');
create policy "Own or admin update"  on projects for update
  using (
    auth.email() = builder_email
    or is_admin()
    or is_approver()
  );
create policy "Admin delete"              on projects for delete using (is_admin());
create policy "Builder delete own seedling" on projects for delete
  using (auth.email() = builder_email and stage = 'seedling');

-- wishes
alter table wishes enable row level security;
create policy "Authenticated read"   on wishes for select
  using (auth.role() = 'authenticated');
create policy "Any user insert"      on wishes for insert
  with check (auth.role() = 'authenticated');
create policy "Own or admin update"  on wishes for update
  using (auth.email() = wisher_email or auth.email() = claimed_by_email or is_admin());
create policy "Admin delete"         on wishes for delete
  using (is_admin());

-- notifications
alter table notifications enable row level security;
create policy "Own notifications read"   on notifications for select using (auth.uid() = user_id);
create policy "Own notifications update" on notifications for update using (auth.uid() = user_id);

-- help_items
alter table help_items enable row level security;
create policy "Authenticated read"      on help_items for select using (auth.role() = 'authenticated');
create policy "Own insert"              on help_items for insert
  with check (auth.role() = 'authenticated' and submitted_by = auth.email());
create policy "Submitter edit while open" on help_items for update
  using (submitted_by = auth.email() and status in ('open', 'unanswered'));
create policy "Admin update"            on help_items for update using (is_admin());
create policy "Admin delete"            on help_items for delete using (is_admin());

-- activity_log
alter table activity_log enable row level security;
create policy "Authenticated read"   on activity_log for select using (auth.role() = 'authenticated');
create policy "Authenticated insert" on activity_log for insert with check (auth.role() = 'authenticated');
