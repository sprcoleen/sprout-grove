-- Grove v2: Stage rename migration
-- Run this FIRST in Supabase dashboard SQL editor, in a single execution.
-- CRITICAL: Must drop the old stage CHECK constraint BEFORE updating values,
--           then re-add the new constraint. All in one transaction.

BEGIN;

-- Step A: Drop the old CHECK constraint (name may vary — check in Supabase
-- Table Editor → projects → Constraints. Common name: projects_stage_check)
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_stage_check;

-- Step B: Rename existing stages
UPDATE projects SET stage = 'seedling' WHERE stage = 'sprout';
UPDATE projects SET stage = 'sprout'   WHERE stage = 'growing';
UPDATE projects SET stage = 'bloom'    WHERE stage = 'blooming';
-- thriving is unchanged

-- Step C: Add the new CHECK constraint with all valid v2 stage values
ALTER TABLE projects ADD CONSTRAINT projects_stage_check
  CHECK (stage IN ('seedling', 'nursery', 'sprout', 'bloom', 'thriving'));

COMMIT;
