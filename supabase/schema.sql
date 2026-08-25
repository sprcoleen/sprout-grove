-- ─────────────────────────────────────────────────────────────────────────────
-- SproutAIGarden (Grove) — Supabase schema
--
-- GENERATED from the live database on 2026-08-25 via tools/dump-schema.sql.
-- DO NOT HAND-EDIT. To change the schema: write a migration in migrations/,
-- run it in the Supabase SQL editor, then regenerate this file.
--
-- This replaces the previous schema.sql (which still declared the pre-rename
-- stages and the is_gardener column) and schema-staging.sql (correct on stages
-- and RLS, but only 32 of the 76 columns the app writes).
--
-- Covers tables, identity, defaults, constraints, functions, RLS and policies.
-- Not covered — stable here and already in migrations/: triggers, grants,
-- extensions, and the auth schema.
-- ─────────────────────────────────────────────────────────────────────────────

-- ============================== TABLES ==============================

create table if not exists profiles (
  id                    uuid not null,
  email                 text not null,
  display_name          text,
  country               text not null,
  is_admin              boolean default false not null,
  created_at            timestamp with time zone default now() not null,
  has_dismissed_welcome boolean default false not null,
  is_approver           boolean default false not null,
  first_name            text,
  is_devops             boolean default false
);

create table if not exists projects (
  id                                 bigint generated always as identity not null,
  country                            text not null,
  name                               text not null,
  built_by                           text,
  built_for                          text[],
  capability                         text,
  -- NOTE: the default is 'sprout' but the app always creates at 'seedling'.
  -- See MD/NEXT-STEPS.md — this is a real inconsistency, not a dump artefact.
  stage                              text default 'sprout'::text not null,
  impact                             text,
  impact_num                         text,
  builder                            text,
  builder_email                      text not null,
  zx                                 integer default 40 not null,
  zy                                 integer default 50 not null,
  notes                              text[] default '{}'::text[] not null,
  milestones                         text[] default '{}'::text[] not null,
  description                        text,
  problem_space                      text,
  data_source                        text,
  demo_link                          text,
  interested_users                   text[] default '{}'::text[] not null,
  image_url                          text,
  last_updated                       timestamp with time zone default now() not null,
  created_at                         timestamp with time zone default now() not null,
  tool_used                          text[] default '{}'::text[],
  prototype_link                     text,
  deck_link                          text,
  review_status                      text,
  review_comment                     text,
  reviewed_by                        text,
  reviewed_at                        timestamp with time zone,
  submitted_at                       timestamp with time zone,
  collaborator_emails                text[] default '{}'::text[],
  data_sources                       text[] default '{}'::text[],
  agentic_framework                  text[] default '{}'::text[],
  is_ui_only                         boolean,
  uses_external_apis                 boolean,
  requires_deployment                boolean,
  tier                               smallint,
  github_repo                        text,
  hosting                            text[],
  database                           text[],
  requires_auth                      boolean,
  external_access                    boolean,
  has_sensitive_data                 boolean,
  sends_to_external_ai               boolean,
  stores_user_inputs                 boolean,
  release_review_status              text,
  release_review_comment             text,
  release_reviewed_by                text,
  release_reviewed_at                timestamp with time zone,
  release_submitted_at               timestamp with time zone,
  has_backend                        boolean,
  target_users                       text,
  has_database                       boolean,
  connects_sprout_db                 boolean,
  auth_type                          text[],
  data_sensitivity                   text,
  sprout_db_details                  text,
  approver_name                      text,
  approver_email                     text,
  approval_status                    text,
  approval_requested_at              timestamp with time zone,
  approved_at                        timestamp with time zone,
  approval_rejected_at               timestamp with time zone,
  approval_rejection_reason          text,
  approval_token                     uuid,
  docs_link                          text,
  ai_assistant                       text[] default '{}'::text[],
  builder_tools                      text[] default '{}'::text[],
  hosting_account                    text,
  version_control                    text[] default '{}'::text[],
  version_control_account            text,
  database_account                   text,
  screenshot_urls                    text[] default '{}'::text[],
  production_hosting                 text,
  production_hosting_url             text,
  production_hosting_account         text,
  production_version_control         text,
  production_version_control_url     text,
  production_version_control_account text,
  production_database                text,
  production_database_url            text,
  production_database_account        text,
  release_date                       date,
  announcement_date                  date,
  problem                            text,
  built                              text,
  better_now                         text
);

create table if not exists wishes (
  id               text not null,             -- format: "w" + integer, e.g. "w10"
  country          text not null,
  title            text not null,
  why              text,
  built_for        text[],
  wisher_name      text,
  wisher_email     text not null,
  upvoters         text[] default '{}'::text[] not null,
  fulfilled_by     text,                      -- project name; never delete fulfilled wishes
  claimed_by       text,
  claimed_by_email text,
  claimed_at       text,
  ready_for_review boolean default false not null,
  prototype_link   text,
  prototype_note   text,
  created_at       timestamp with time zone default now() not null
);

create table if not exists activity_log (
  id          bigint generated always as identity not null,
  event_type  text not null,
  actor_email text,
  actor_name  text,
  project_id  text,
  wish_id     text,
  from_stage  text,
  to_stage    text,
  entity_name text not null,
  created_at  timestamp with time zone default now() not null
);

create table if not exists notifications (
  id         uuid default gen_random_uuid() not null,
  user_id    uuid not null,
  type       text not null,
  payload    jsonb,
  read       boolean default false not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists delete_requests (
  id           bigint generated always as identity not null,
  entity_type  text not null,
  entity_id    text not null,
  entity_name  text not null,
  requested_by text not null,
  reason       text not null,
  status       text default 'pending'::text not null,
  reviewed_by  text,
  reviewed_at  timestamp with time zone,
  created_at   timestamp with time zone default now() not null
);

create table if not exists devops_requests (
  id              bigint generated always as identity not null,
  project_id      text not null,
  project_name    text not null,
  builder_email   text not null,
  requested_by    text not null,
  github_repo     text,
  hosting         text,
  database        text,
  status          text default 'todo'::text not null,
  devops_notes    text,
  country         text,
  created_at      timestamp with time zone default now() not null,
  updated_at      timestamp with time zone default now() not null,
  jira_ticket_key text
);

create table if not exists rooting_reviews (
  id               uuid default gen_random_uuid() not null,
  project_id       text not null,
  project_name     text,
  builder_name     text,
  builder_email    text,
  reviewer_name    text,
  reviewer_email   text,
  status           text default 'pending'::text,
  rejection_reason text,
  country          text,
  created_at       timestamp with time zone default now(),
  resolved_at      timestamp with time zone,
  prototype_link   text,
  deck_link        text,
  docs_link        text
);

create table if not exists help_items (
  id           uuid default gen_random_uuid() not null,
  type         text not null,
  title        text not null,
  description  text,
  submitted_by text not null,
  created_at   timestamp with time zone default now() not null,
  updated_at   timestamp with time zone default now() not null,
  status       text default 'open'::text not null,
  resolved_by  text,
  resolved_at  timestamp with time zone,
  upvoters     text[] default '{}'::text[] not null
);

create table if not exists changelog (
  id           uuid default gen_random_uuid() not null,
  entry_date   date not null,
  title        text not null,
  description  text not null,
  tags         text[] default '{}'::text[],
  is_milestone boolean default false,
  created_at   timestamp with time zone default now()
);

-- ============================ CONSTRAINTS ============================

alter table profiles add constraint profiles_pkey PRIMARY KEY (id);
alter table profiles add constraint profiles_email_key UNIQUE (email);
alter table profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table profiles add constraint profiles_country_check CHECK ((country = ANY (ARRAY['PH'::text, 'TH'::text])));

alter table projects add constraint projects_pkey PRIMARY KEY (id);
alter table projects add constraint projects_country_check CHECK ((country = ANY (ARRAY['PH'::text, 'TH'::text])));
alter table projects add constraint projects_stage_check CHECK ((stage = ANY (ARRAY['seedling'::text, 'nursery'::text, 'sprout'::text, 'bloom'::text, 'thriving'::text])));
alter table projects add constraint projects_review_status_check CHECK ((review_status = ANY (ARRAY['pending'::text, 'approved'::text, 'needs_rework'::text])));
alter table projects add constraint projects_target_users_check CHECK ((target_users = ANY (ARRAY['internal'::text, 'external'::text, 'both'::text])));

alter table wishes add constraint wishes_pkey PRIMARY KEY (id);
alter table wishes add constraint wishes_country_check CHECK ((country = ANY (ARRAY['PH'::text, 'TH'::text])));

alter table activity_log add constraint activity_log_pkey PRIMARY KEY (id);

alter table notifications add constraint notifications_pkey PRIMARY KEY (id);
alter table notifications add constraint notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table delete_requests add constraint delete_requests_pkey PRIMARY KEY (id);
alter table delete_requests add constraint delete_requests_entity_type_check CHECK ((entity_type = ANY (ARRAY['project'::text, 'wish'::text])));
alter table delete_requests add constraint delete_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'denied'::text])));

alter table devops_requests add constraint devops_requests_pkey PRIMARY KEY (id);

alter table rooting_reviews add constraint rooting_reviews_pkey PRIMARY KEY (id);

alter table help_items add constraint help_items_pkey PRIMARY KEY (id);
alter table help_items add constraint help_items_type_check CHECK ((type = ANY (ARRAY['report'::text, 'ask'::text])));
alter table help_items add constraint help_items_status_check CHECK ((status = ANY (ARRAY['open'::text, 'resolved'::text, 'unanswered'::text, 'answered'::text])));

alter table changelog add constraint changelog_pkey PRIMARY KEY (id);

-- ============================= FUNCTIONS =============================

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
    SELECT COALESCE(
      (SELECT is_admin FROM profiles WHERE id = auth.uid()),
      false
    );
  $function$;

CREATE OR REPLACE FUNCTION public.is_approver()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
    SELECT COALESCE(
      (SELECT is_approver FROM profiles WHERE id = auth.uid()),
      false
    );
  $function$;

CREATE OR REPLACE FUNCTION public.help_items_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $function$;

-- NOTE: dead and broken. Takes p_id uuid, but projects.id is bigint, so it can
-- never match a row. Nothing in src/ calls it. See MD/NEXT-STEPS.md.
CREATE OR REPLACE FUNCTION public.withdraw_from_nursery(p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM projects
      WHERE id = p_id
        AND builder_email = auth.email()
        AND stage = 'nursery'
        AND review_status = 'pending'
    ) THEN
      RAISE EXCEPTION 'Not authorized or invalid state for withdrawal';
    END IF;
    UPDATE projects
      SET stage = 'seedling',
          review_status = NULL
      WHERE id = p_id;
  END;
  $function$;

-- ========================= ROW LEVEL SECURITY =========================

alter table profiles        enable row level security;
alter table projects        enable row level security;
alter table wishes          enable row level security;
alter table activity_log    enable row level security;
alter table notifications   enable row level security;
alter table delete_requests enable row level security;
alter table devops_requests enable row level security;
alter table rooting_reviews enable row level security;
alter table help_items      enable row level security;
alter table changelog       enable row level security;

-- ============================== POLICIES ==============================

-- profiles
create policy "Public read" on profiles for select to public using (true);
create policy "Own insert"  on profiles for insert to public with check ((auth.uid() = id));
create policy "Own update"  on profiles for update to public using ((auth.uid() = id)) with check ((auth.uid() = id));

-- projects
create policy "Authenticated read" on projects for select to public using ((auth.role() = 'authenticated'::text));
create policy "Any user insert"    on projects for insert to public with check ((auth.role() = 'authenticated'::text));
-- NOTE: approvers can update ANY project, not just admins and the builder.
create policy "Own or admin update" on projects for update to public using (((auth.email() = builder_email) OR is_admin() OR is_approver()));
create policy "Admin delete"        on projects for delete to public using (is_admin());
-- NOTE: builders CAN hard-delete their own seedling projects without a
-- delete_request. This contradicts the "nobody deletes directly" rule in
-- claude.md §3. See MD/NEXT-STEPS.md.
create policy "Builder delete own seedling" on projects for delete to public using (((auth.email() = builder_email) AND (stage = 'seedling'::text)));

-- wishes
create policy "Authenticated read"  on wishes for select to public using ((auth.role() = 'authenticated'::text));
create policy "Any user insert"     on wishes for insert to public with check ((auth.role() = 'authenticated'::text));
create policy "Own or admin update" on wishes for update to public using (((auth.email() = wisher_email) OR (auth.email() = claimed_by_email) OR is_admin()));
create policy "Admin delete"        on wishes for delete to public using (is_admin());

-- activity_log
create policy "Authenticated read"   on activity_log for select to public using ((auth.role() = 'authenticated'::text));
create policy "Authenticated insert" on activity_log for insert to public with check ((auth.role() = 'authenticated'::text));

-- notifications
create policy "Own notifications read"   on notifications for select to public using ((auth.uid() = user_id));
create policy "Own notifications update" on notifications for update to public using ((auth.uid() = user_id));

-- delete_requests
create policy "Authenticated read"       on delete_requests for select to public using ((auth.role() = 'authenticated'::text));
create policy "User insert own request"  on delete_requests for insert to public with check (((auth.role() = 'authenticated'::text) AND (auth.email() = requested_by)));
create policy "Admin update"             on delete_requests for update to public using (is_admin());
create policy "Admin delete"             on delete_requests for delete to public using (is_admin());

-- devops_requests
create policy "Authenticated read"      on devops_requests for select to public using ((auth.role() = 'authenticated'::text));
create policy "Any user insert"         on devops_requests for insert to public with check ((auth.role() = 'authenticated'::text));
create policy "Admin or devops update"  on devops_requests for update to public using ((is_admin() OR COALESCE(( SELECT profiles.is_devops
   FROM profiles
  WHERE (profiles.id = auth.uid())), false)));
create policy "Admin delete"            on devops_requests for delete to public using (is_admin());

-- rooting_reviews
create policy "Authenticated read"   on rooting_reviews for select to public using ((auth.role() = 'authenticated'::text));
create policy "Authenticated insert" on rooting_reviews for insert to public with check ((auth.role() = 'authenticated'::text));
-- NOTE: named "Service role update" but scoped `to public using (true)` —
-- any authenticated user can update any rooting review. See MD/NEXT-STEPS.md.
create policy "Service role update"  on rooting_reviews for update to public using (true);

-- help_items
create policy "Authenticated read"        on help_items for select to public using ((auth.role() = 'authenticated'::text));
create policy "Own insert"                on help_items for insert to public with check (((auth.role() = 'authenticated'::text) AND (submitted_by = auth.email())));
create policy "Submitter edit while open" on help_items for update to public using (((submitted_by = auth.email()) AND (status = ANY (ARRAY['open'::text, 'unanswered'::text]))));
create policy "Admin update"              on help_items for update to public using (is_admin());
create policy "Admin delete"              on help_items for delete to public using (is_admin());

-- changelog
create policy "Authenticated read" on changelog for select to public using ((auth.role() = 'authenticated'::text));
create policy "Admin insert"       on changelog for insert to public with check (is_admin());
create policy "Admin update"       on changelog for update to public using (is_admin());
create policy "Admin delete"       on changelog for delete to public using (is_admin());
