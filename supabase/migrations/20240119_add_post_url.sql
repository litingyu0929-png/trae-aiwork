-- Phase 6.3: Ensure daily_tasks columns exist

ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS post_url TEXT;
