-- supabase/migrations/24-approval-token.sql
-- Adds approval_token to projects — required for the email Approve/Reject links
-- in send-approval-email.js and handle-approval.js to work correctly.
-- Run in Supabase Dashboard → SQL Editor.

alter table projects
  add column if not exists approval_token text default null;
