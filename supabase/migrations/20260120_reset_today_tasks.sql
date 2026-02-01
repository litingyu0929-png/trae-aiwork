-- Reset daily tasks for today (for testing purposes)
DELETE FROM daily_tasks 
WHERE task_date = CURRENT_DATE;
