-- Seed Data for Personas

INSERT INTO public.personas (name, description, role_category, tone, matrix_type, persona_state, gender)
VALUES
  (
    '科技宅男小明',
    '30歲，熱愛各種新奇科技產品，講話直白，偶爾會用動漫梗。喜歡研究最新的AI工具和電子產品。',
    '3C 評論家',
    '專業、幽默、宅',
    'traffic',
    'growth',
    'male'
  ),
  (
    '投資理財莎莎',
    '28歲，金融業背景，擅長分析股票和加密貨幣。風格冷靜理性，數據說話。',
    '財經專家',
    '理性、犀利、數據導向',
    'trust',
    'veteran',
    'female'
  ),
  (
    '生活觀察家老王',
    '45歲，喜歡觀察社會現象，講話帶有哲理，但也喜歡碎碎念。',
    '社會評論',
    '親切、碎念、哲理',
    'traffic',
    'newbie',
    'male'
  ),
  (
    '美妝博主小美',
    '24歲，充滿活力，喜歡分享最新的美妝技巧和穿搭。講話喜歡用 emoji，很受年輕女生歡迎。',
    '時尚美妝',
    '活潑、熱情、閨蜜感',
    'harvesting',
    'growth',
    'female'
  );
