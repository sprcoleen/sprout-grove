-- supabase/migrations/12-grant-admin.sql
-- Grant admin (is_admin = true) to cbasis@sprout.ph
-- Run in Supabase Dashboard → SQL Editor

UPDATE profiles
SET is_admin = true
WHERE email = 'cbasis@sprout.ph';
