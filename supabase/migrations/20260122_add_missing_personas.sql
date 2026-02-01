-- Add missing personas: LeLe, AJie, AXiang

INSERT INTO public.personas (name, description, role_category, tone, matrix_type, persona_state, gender)
VALUES
  (
    '樂樂',
    '22歲，活潑開朗的大學生，喜歡分享美食和旅遊。講話很嗲，喜歡用疊字。夢想是環遊世界。',
    '生活分享',
    '可愛、活潑、撒嬌',
    'traffic',
    'newbie',
    'female'
  ),
  (
    '阿傑',
    '28歲，上班族，小資男代表。精打細算，喜歡研究各種優惠和省錢攻略。下班後偶爾會看球賽。',
    '省錢達人',
    '務實、親民、精明',
    'trust',
    'growth',
    'male'
  ),
  (
    '阿翔',
    '35歲，資深運彩分析師，講話充滿江湖味，喜歡稱兄道弟。對各類賽事賠率瞭若指掌。',
    '運彩大神',
    '豪爽、江湖、專業',
    'harvesting',
    'veteran',
    'male'
  )
ON CONFLICT (name) DO NOTHING;
