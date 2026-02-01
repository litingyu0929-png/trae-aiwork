// src/lib/keywordEngine/matrix.ts

export type DomainKey = 
  | 'sports_nba' 
  | 'sports_mlb' 
  | 'sports_kbo' 
  | 'sports_npb' 
  | 'sports_soccer' 
  | 'casino_baccarat' 
  | 'casino_slots' 
  | 'daily_life' 
  | 'finance'
  | 'general';

export interface KeywordDefinition {
  term: string;
  weight: number; // 0.1 - 1.0 (1.0 = 核心詞, 0.5 = 相關詞)
}

export const KEYWORD_MATRIX: Record<DomainKey, KeywordDefinition[]> = {
  'sports_nba': [
    { term: 'nba', weight: 1.0 },
    { term: '籃球', weight: 0.9 },
    { term: '職籃', weight: 0.9 },
    { term: 'basketball', weight: 1.0 },
    { term: 'lakers', weight: 0.8 },
    { term: 'warriors', weight: 0.8 },
    { term: 'lebron', weight: 0.7 },
    { term: 'curry', weight: 0.7 },
    { term: '季後賽', weight: 0.6 },
    { term: '總冠軍', weight: 0.6 }
  ],
  'sports_mlb': [
    { term: 'mlb', weight: 1.0 },
    { term: '棒球', weight: 0.9 },
    { term: '職棒', weight: 0.9 },
    { term: '大聯盟', weight: 1.0 },
    { term: 'baseball', weight: 1.0 },
    { term: '大谷', weight: 0.8 },
    { term: 'shohei', weight: 0.8 },
    { term: 'ohtani', weight: 0.8 },
    { term: '洋基', weight: 0.7 },
    { term: '道奇', weight: 0.7 },
    { term: '全壘打', weight: 0.6 },
    { term: 'homerun', weight: 0.6 }
  ],
  'sports_kbo': [
    { term: 'kbo', weight: 1.0 },
    { term: '韓職', weight: 1.0 },
    { term: '韓國職棒', weight: 1.0 },
    { term: '韓棒', weight: 0.9 },
    { term: '斗山熊', weight: 0.7 },
    { term: '三星獅', weight: 0.7 },
    { term: '起亞虎', weight: 0.7 }
  ],
  'sports_npb': [
    { term: 'npb', weight: 1.0 },
    { term: '日職', weight: 1.0 },
    { term: '日本職棒', weight: 1.0 },
    { term: '日棒', weight: 0.9 },
    { term: '巨人', weight: 0.6 }, // 容易混淆
    { term: '讀賣巨人', weight: 0.8 },
    { term: '阪神虎', weight: 0.8 },
    { term: '甲子園', weight: 0.7 }
  ],
  'sports_soccer': [
    { term: 'soccer', weight: 1.0 },
    { term: 'football', weight: 0.9 }, // 容易混淆美式足球
    { term: '足球', weight: 1.0 },
    { term: '世足', weight: 1.0 },
    { term: '世界盃', weight: 1.0 },
    { term: 'world cup', weight: 1.0 },
    { term: '英超', weight: 0.9 },
    { term: '西甲', weight: 0.9 },
    { term: '歐冠', weight: 0.9 },
    { term: 'ucl', weight: 0.9 },
    { term: '梅西', weight: 0.7 },
    { term: 'messi', weight: 0.7 },
    { term: 'c羅', weight: 0.7 },
    { term: 'ronaldo', weight: 0.7 }
  ],
  'casino_baccarat': [
    { term: 'baccarat', weight: 1.0 },
    { term: '百家樂', weight: 1.0 },
    { term: '百家', weight: 0.9 },
    { term: '莊閒', weight: 0.9 },
    { term: '莊家', weight: 0.8 },
    { term: '閒家', weight: 0.8 },
    { term: '路單', weight: 0.8 },
    { term: '長龍', weight: 0.8 },
    { term: '單跳', weight: 0.7 },
    { term: '補牌', weight: 0.6 }
  ],
  'casino_slots': [
    { term: 'slot', weight: 1.0 },
    { term: 'slots', weight: 1.0 },
    { term: '老虎機', weight: 1.0 },
    { term: '電子遊戲', weight: 0.9 },
    { term: '雷神', weight: 0.7 }, // 容易混淆
    { term: '雷神之錘', weight: 0.9 },
    { term: '戰神賽特', weight: 0.9 },
    { term: '魔龍', weight: 0.8 },
    { term: '爆分', weight: 0.8 },
    { term: '咬分', weight: 0.7 },
    { term: '轉數', weight: 0.6 },
    { term: 'jackpot', weight: 0.9 }
  ],
  'daily_life': [
    { term: '生活', weight: 0.5 },
    { term: '日常', weight: 0.5 },
    { term: '省錢', weight: 0.9 },
    { term: 'cp值', weight: 0.9 },
    { term: '優惠', weight: 0.8 },
    { term: '特價', weight: 0.8 },
    { term: '小資', weight: 0.9 },
    { term: '團購', weight: 0.7 },
    { term: '美食', weight: 0.6 },
    { term: '旅遊', weight: 0.6 }
  ],
  'finance': [
    { term: '理財', weight: 0.9 },
    { term: '投資', weight: 0.9 },
    { term: '股票', weight: 0.9 },
    { term: '股市', weight: 0.9 },
    { term: '房貸', weight: 0.8 },
    { term: '升息', weight: 0.8 },
    { term: 'etf', weight: 0.8 },
    { term: '存股', weight: 0.8 }
  ],
  'general': []
};

// 領域對應的素材類型白名單
export const DOMAIN_TO_ASSET_TYPES: Record<DomainKey, string[]> = {
  'sports_nba': ['nba', 'uploaded_image'],
  'sports_mlb': ['mlb', 'uploaded_image'],
  'sports_kbo': ['kbo', 'uploaded_image'],
  'sports_npb': ['npb', 'uploaded_image'],
  'sports_soccer': ['soccer', 'uploaded_image'],
  'casino_baccarat': ['casino_baccarat', 'casino_baccarat_live', 'uploaded_image'],
  'casino_slots': ['casino_slots_tiger', 'casino_slots_generic', 'uploaded_image'],
  'daily_life': ['daily', 'funny', 'news', 'uploaded_image'],
  'finance': ['news', 'daily', 'uploaded_image'],
  'general': ['daily', 'news', 'funny', 'uploaded_image'] // Fallback
};
