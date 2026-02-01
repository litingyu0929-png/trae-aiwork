-- 1. 資料庫修改 (Database Migration)
-- 由於 profiles 表是 users 表的延伸，我們將 staff_type 加在 profiles 表中
-- (假設 auth.users 是 Supabase 內部表，通常不建議直接改，除非是 public.users)
-- 檢查 profiles 表是否已經有 staff_type
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS staff_type TEXT DEFAULT 'operator';
-- 值域: 'closer' (攻堅手/Type A), 'operator' (運營手/Type B)

-- 為了測試方便，隨機將一位現有員工設為 closer
UPDATE profiles SET staff_type = 'closer'
WHERE id IN (SELECT id FROM profiles WHERE role = 'staff' LIMIT 1);
