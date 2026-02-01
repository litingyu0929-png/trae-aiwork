-- Seed data for knowledge_base (Glossary)
INSERT INTO public.knowledge_base (category, content, tags) VALUES
-- 專有名詞定義 (glossary)
('glossary', '塞特：一款熱門的電子老虎機遊戲（Slot Game），以埃及神話為主題。', ARRAY['電子', '老虎機', '塞特']),
('glossary', '雷神：指「雷神之錘」，一款熱門的電子老虎機遊戲，特色是消除掉落機制。', ARRAY['電子', '老虎機', '雷神']),
('glossary', '戰神：指「戰神賽特」，即塞特，同款遊戲。', ARRAY['電子', '老虎機', '戰神']),
('glossary', '魔龍：指「魔龍傳奇」，一款經典的老虎機遊戲。', ARRAY['電子', '老虎機', '魔龍']),
('glossary', '爆分：指在電子遊戲或運彩中贏得大額獎金，並非指運動員得分。', ARRAY['術語', '中獎']),
('glossary', '咬：指機台或盤口狀況不佳，一直輸錢（例如：這台很咬）。', ARRAY['術語', '輸錢']),
('glossary', '軟：指機台容易中獎（例如：這台很軟）。', ARRAY['術語', '中獎']),
('glossary', '收米：指贏錢、獲利。', ARRAY['術語', '獲利']),
('glossary', '走地：指運彩中的「場中投注」，即比賽開始後進行的下注。', ARRAY['運彩', '玩法']),
('glossary', '串關：指將多場賽事串在一起下注，賠率相乘，風險高回報高。', ARRAY['運彩', '玩法']);
