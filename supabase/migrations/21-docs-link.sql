-- Add documentation link field to projects
alter table projects add column if not exists docs_link text default null;

-- Add review material link columns to rooting_reviews
-- (run this only if migration 20 was already applied without these columns)
alter table rooting_reviews add column if not exists prototype_link text default null;
alter table rooting_reviews add column if not exists deck_link      text default null;
alter table rooting_reviews add column if not exists docs_link      text default null;
