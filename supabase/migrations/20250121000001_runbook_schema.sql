-- 1. 擴充 work_tasks (任務表) - 補上 task_kind
ALTER TABLE work_tasks
ADD COLUMN IF NOT EXISTS task_kind TEXT DEFAULT 'content_post'; -- 區分: 'ops_reply', 'ops_hype', 'ops_intercept', 'content_post'

-- 2. 建立 work_task_logs 表 (用於員工回填結果)
-- Note: Using profiles(id) instead of users(id) as per standard Supabase pattern for public schema foreign keys
CREATE TABLE IF NOT EXISTS work_task_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES work_tasks(id),
  staff_id UUID REFERENCES profiles(id),
  result_status TEXT,                   -- 'done', 'skipped', 'blocked'
  evidence_url TEXT,                    -- 截圖或連結
  notes TEXT,                           -- 員工備註
  counts JSONB DEFAULT '{}',            -- KPI 數據: { "inbound_count": 5, "ftd_count": 1 }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 索引優化 (If not exists from previous run)
CREATE INDEX IF NOT EXISTS idx_work_tasks_staff_date ON work_tasks (staff_id, task_date);
