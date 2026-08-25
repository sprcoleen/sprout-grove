-- supabase/tools/dump-schema.sql
--
-- Generates the full DDL of the public schema as text, from inside the
-- Supabase SQL editor. Use this to regenerate supabase/schema.sql without
-- needing pg_dump, Docker, or the database password.
--
-- HOW TO USE
--   1. Supabase Dashboard -> SQL Editor -> New query
--   2. Paste this whole file, Run
--   3. Export the result: the "Download CSV" button, or select the ddl
--      column and copy
--   4. Save it over supabase/schema.sql (strip the CSV header/quoting)
--
-- Covers: tables, columns, types, defaults, not-null, constraints (PK/FK/
-- unique/check), indexes, RLS enablement, RLS policies, and functions.
-- It does NOT cover: triggers, grants, extensions, sequences owned outside
-- the public schema. Those are stable here and already in the migrations.

with cols as (
  select
    c.relname as tbl,
    '  ' || quote_ident(a.attname) || ' ' || format_type(a.atttypid, a.atttypmod)
      || coalesce(' default ' || pg_get_expr(d.adbin, d.adrelid), '')
      || case when a.attnotnull then ' not null' else '' end as line,
    a.attnum
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
  where n.nspname = 'public' and c.relkind = 'r'
),
tables as (
  select
    tbl,
    'create table if not exists ' || quote_ident(tbl) || ' (' || chr(10)
      || string_agg(line, ',' || chr(10) order by attnum)
      || chr(10) || ');' as ddl
  from cols
  group by tbl
)
select 1 as section, '-- ============ TABLES ============' as ddl
union all
select 1, ddl from tables

union all
select 2, '-- ============ CONSTRAINTS ============'
union all
select 2,
  'alter table ' || quote_ident(rel.relname)
    || ' add constraint ' || quote_ident(con.conname) || ' '
    || pg_get_constraintdef(con.oid) || ';'
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_namespace n on n.oid = rel.relnamespace
where n.nspname = 'public'
  and con.contype in ('p', 'f', 'u', 'c')

union all
select 3, '-- ============ INDEXES ============'
union all
select 3, indexdef || ';'
from pg_indexes
where schemaname = 'public'
  -- skip indexes Postgres created to back a PK/unique constraint above
  and indexname not in (
    select con.conname from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace n on n.oid = rel.relnamespace
    where n.nspname = 'public' and con.contype in ('p', 'u')
  )

union all
select 4, '-- ============ FUNCTIONS ============'
union all
select 4, pg_get_functiondef(p.oid) || ';'
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prokind = 'f'

union all
select 5, '-- ============ ROW LEVEL SECURITY ============'
union all
select 5, 'alter table ' || quote_ident(c.relname) || ' enable row level security;'
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity

union all
select 6, '-- ============ POLICIES ============'
union all
select 6,
  'create policy ' || quote_ident(policyname)
    || ' on ' || quote_ident(tablename)
    || ' for ' || lower(cmd)
    || ' to ' || array_to_string(roles, ', ')
    || coalesce(' using (' || qual || ')', '')
    || coalesce(' with check (' || with_check || ')', '')
    || ';'
from pg_policies
where schemaname = 'public'

-- section first, then text: the '-- =====' headers sort ahead of the
-- statements in each section because '-' precedes letters
order by section, ddl;
