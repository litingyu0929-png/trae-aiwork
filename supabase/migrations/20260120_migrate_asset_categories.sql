
-- 體育類別遷移 (Sports Migration)
UPDATE assets SET category = 'Sports_Basket' WHERE category IN ('NBA', 'Basketball', 'nba', 'basketball');
UPDATE assets SET category = 'Sports_Base' WHERE category IN ('MLB', 'Baseball', 'mlb', 'baseball');
UPDATE assets SET category = 'Sports_Soccer' WHERE category IN ('Soccer', 'Football', 'soccer', 'football', '足球', '英超', '歐冠');

-- 賭場類別遷移 (Casino Migration)
UPDATE assets SET category = 'Casino_Baccarat' WHERE category IN ('CASINO BACCARAT', 'casino_baccarat', 'baccarat', '百家樂');
UPDATE assets SET category = 'Casino_Slots' WHERE category IN ('CASINO SLOT', 'casino_slot', 'slot', 'slots', '老虎機', '捕魚');

-- 彩票類別遷移 (Lottery Migration)
UPDATE assets SET category = 'Lottery_Six' WHERE category IN ('Lottery', 'Six Mark', 'lottery', 'six_mark', '六合彩', '539');

-- 日常/新聞類別遷移 (Traffic/Funny Migration)
UPDATE assets SET category = 'Traffic_Funny' WHERE category IN ('DAILY', 'NEWS', '搞笑/日常', '生活', 'daily', 'news', 'funny');

-- 確保所有未分類項目有默認值
UPDATE assets SET category = 'Traffic_Funny' WHERE category IS NULL OR category = '';

-- 視覺識別類別 (Winning_Proof)
-- 注意：這部分通常由 AI 視覺識別後自動標記，這裡僅作示例或手動修正
-- UPDATE assets SET category = 'Winning_Proof' WHERE tags @> '{"winning", "proof"}';
