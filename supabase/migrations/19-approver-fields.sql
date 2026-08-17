-- supabase/migrations/19-approver-fields.sql
-- Adds approver request fields to projects.
-- Run in Supabase Dashboard → SQL Editor.

alter table projects add column if not exists approval_rejected_at      timestamptz default null;
alter table projects add column if not exists approval_rejection_reason text        default null;
alter table projects add column if not exists approval_token            uuid        default null;
