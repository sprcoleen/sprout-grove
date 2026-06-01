-- 14-devops-jira-key.sql
-- Adds jira_ticket_key column to devops_requests for tracking auto-created Jira tickets.

alter table devops_requests add column if not exists jira_ticket_key text;
