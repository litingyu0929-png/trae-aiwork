-- 1. 擴充 work_tasks (任務表) 以支援 SOP 指令
ALTER TABLE work_tasks
ADD COLUMN IF NOT EXISTS time_block TEXT DEFAULT 'production', -- 關鍵：區分 'wake_up', 'warm_up', 'production', 'war', 'closing'
ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0,               -- 關鍵：用於儀表板排序 (逾期或重要任務置頂)
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}';           -- 關鍵：存放 SOP 指令 (例如: {"instruction": "去同業留言", "do": ["點讚", "不留連結"]})

-- 2. 新增 work_task_logs (回填紀錄表)
CREATE TABLE IF NOT EXISTS work_task_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES work_tasks(id),
  staff_id UUID REFERENCES profiles(id),   -- Changed from users(id) to profiles(id) to match existing schema
  result_status TEXT,                   -- 'done', 'skipped', 'blocked'
  evidence_url TEXT,                    -- 截圖或貼文連結 (對應 work_tasks.post_url)
  notes TEXT,                           -- 員工備註
  counts JSONB DEFAULT '{}',            -- 重要 KPI：{ "inbound_count": 5, "ftd_count": 1 }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 建立索引 (優化儀表板查詢速度)
CREATE INDEX IF NOT EXISTS idx_work_tasks_staff_date
ON work_tasks (staff_id, task_date);

CREATE INDEX IF NOT EXISTS idx_work_tasks_status
ON work_tasks (status);
