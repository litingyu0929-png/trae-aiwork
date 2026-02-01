-- 清除所有素材庫資料 (移除虛擬數據)

-- 1. 解除與 daily_tasks 的關聯 (保留任務，但移除素材連結)
UPDATE daily_tasks SET asset_id = NULL;

-- 2. 解除與 work_tasks 的關聯
UPDATE work_tasks SET assigned_asset_id = NULL;

-- 3. 刪除相關的 contents (因為內容是基於素材生成的，素材沒了內容也應刪除)
DELETE FROM contents;

-- 4. 清空 assets 表
TRUNCATE TABLE assets CASCADE;

-- 5. 重置 rss_feeds 的 last_fetched_at 以便重新爬取
UPDATE rss_feeds SET last_fetched_at = NULL;
