-- 修正 assets_visibility_check 約束，確保允許 'shared'
-- 先移除可能存在的舊約束
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_visibility_check;

-- 重新加入約束，允許 'private', 'shared', 'public'
ALTER TABLE assets ADD CONSTRAINT assets_visibility_check 
  CHECK (visibility IN ('private', 'shared', 'public'));
