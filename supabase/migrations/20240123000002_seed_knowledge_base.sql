-- Seed data for knowledge_base
INSERT INTO public.knowledge_base (category, content, tags) VALUES
-- 1. 領錢快感 (arrival_status)
('arrival_status', '聽到網銀叮咚那一聲，整天的疲勞都沒了！💸', ARRAY['入帳', '爽感']),
('arrival_status', '看著餘額數字往上跳，這就是我堅持下去的動力。📈', ARRAY['餘額', '動力']),
('arrival_status', '雖然不是什麼大錢，但這筆入帳來得正是時候！', ARRAY['小確幸', '及時雨']),
('arrival_status', '不用羨慕別人，自己賺來的花起來最踏實。💪', ARRAY['踏實', '自信']),

-- 2. 生活爽感 (lifestyle_link)
('lifestyle_link', '今晚晚餐直接升級，和牛吃到飽不手軟！🥩', ARRAY['美食', '慶祝']),
('lifestyle_link', '下個月的房租有人幫忙付了，心情就是鬆了一口氣～😌', ARRAY['房租', '安心']),
('lifestyle_link', '購物車裡放很久的那個包包，終於可以結帳了！👜', ARRAY['購物', '獎勵']),
('lifestyle_link', '週末說走就走的旅行，車票飯店通通搞定！🚅', ARRAY['旅遊', '自由']),

-- 3. 情緒鉤子 (emotional_hook)
('emotional_hook', '你還在觀望嗎？我都已經領兩波了！👀', ARRAY['觀望', 'FOMO']),
('emotional_hook', '機會從來不等猶豫的人，跟上就是現在。🚀', ARRAY['機會', '行動']),
('emotional_hook', '別再問我穩不穩，看我的單子就知道。😎', ARRAY['實力', '證明']),
('emotional_hook', '想改變現狀其實不難，難的是你不敢跨出第一步。', ARRAY['改變', '心靈雞湯']),

-- 4. 銷售話術 (sales_pitch)
('sales_pitch', '【獨家分析】今晚這場賽事數據超漂亮，勝率高達 85%！🔥', ARRAY['數據', '高勝率']),
('sales_pitch', '跟著團隊走，不用自己熬夜看盤，輕鬆收米！🍚', ARRAY['團隊', '輕鬆']),
('sales_pitch', '限時開放 10 個名額，帶你體驗什麼叫「精準命中」。🎯', ARRAY['限時', '精準']),
('sales_pitch', '運彩不是賭博，是投資。讓我們教你如何看懂盤口。📊', ARRAY['投資', '教育']),

-- 5. 產品優勢 (product_info)
('product_info', '我們的系統 24 小時監控水位變化，絕不錯過任何獲利機會。⏰', ARRAY['監控', '獲利']),
('product_info', '專業分析師團隊坐鎮，拒絕盲目下注。👨‍🏫', ARRAY['專業', '分析']),
('product_info', 'VIP 群組每日提供獨家內幕消息，讓你贏在起跑點。🏁', ARRAY['VIP', '內幕']),

-- 6. 常見問答 (faq)
('faq', 'Q: 新手完全不懂可以嗎？\nA: 沒問題！我們有專人一對一教學，包教包會！🤝', ARRAY['新手', '教學']),
('faq', 'Q: 需要多少本金？\nA: 小資也能起步，重點是積少成多，慢慢滾大！💰', ARRAY['本金', '小資']);
