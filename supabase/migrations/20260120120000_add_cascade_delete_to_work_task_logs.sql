
ALTER TABLE work_task_logs
DROP CONSTRAINT work_task_logs_task_id_fkey;

ALTER TABLE work_task_logs
ADD CONSTRAINT work_task_logs_task_id_fkey
FOREIGN KEY (task_id)
REFERENCES work_tasks(id)
ON DELETE CASCADE;
