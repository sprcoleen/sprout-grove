-- Edit form v2 — new fields from stage-organised edit page redesign

-- Tech stack: split AI assistant (chat) from builder tools (build/automate)
alter table projects add column if not exists ai_assistant          text[]  default '{}';
alter table projects add column if not exists builder_tools         text[]  default '{}';

-- Account type for hosting, version control, and database
alter table projects add column if not exists hosting_account                text    default null; -- 'personal' | 'company'
alter table projects add column if not exists version_control                text[]  default '{}'; -- platform chips
alter table projects add column if not exists version_control_account        text    default null; -- 'personal' | 'company'
alter table projects add column if not exists database_account               text    default null; -- 'personal' | 'company'

-- Screenshots (up to 3 URLs, stored in Supabase Storage)
alter table projects add column if not exists screenshot_urls       text[]  default '{}';

-- Production environment (Bloom stage)
alter table projects add column if not exists production_hosting             text    default null;
alter table projects add column if not exists production_hosting_url         text    default null;
alter table projects add column if not exists production_hosting_account     text    default null;
alter table projects add column if not exists production_version_control     text    default null;
alter table projects add column if not exists production_version_control_url text    default null;
alter table projects add column if not exists production_version_control_account text default null;
alter table projects add column if not exists production_database            text    default null;
alter table projects add column if not exists production_database_url        text    default null;
alter table projects add column if not exists production_database_account    text    default null;

-- Go-live dates (Bloom stage)
alter table projects add column if not exists release_date          date    default null;
alter table projects add column if not exists announcement_date     date    default null;
