
-- Ensure task_logs has ON DELETE CASCADE for task_id
ALTER TABLE task_logs
DROP CONSTRAINT IF EXISTS task_logs_task_id_fkey;

ALTER TABLE task_logs
ADD CONSTRAINT task_logs_task_id_fkey
FOREIGN KEY (task_id) REFERENCES work_tasks(id)
ON DELETE CASCADE;

-- Ensure contents created_by or asset_id doesn't block (they shouldn't)

-- Ensure interactions account_id cascades?
-- interactions -> accounts.
-- accounts -> assigned_to (profile).
-- accounts DOES NOT link to persona directly.
-- work_tasks links to accounts.
-- If work_tasks is deleted, account remains.
-- If persona is deleted -> work_tasks deleted.
-- Account remains.
-- So interactions remain.
-- No issue there.

-- Just in case, add cascade to other potential blockers if any.
-- But task_logs is the most likely candidate for dynamic data.
