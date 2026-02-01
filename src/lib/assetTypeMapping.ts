// src/lib/assetTypeMapping.ts

export const CANONICAL_ASSET_TYPES = {
  // 運動類
  SPORTS_NBA: 'nba',
  SPORTS_MLB: 'mlb',
  SPORTS_NPB: 'npb',
  SPORTS_KBO: 'kbo',
  SPORTS_CPBL: 'cpbl',
  SPORTS_SOCCER: 'soccer',
  
  // 博弈類
  CASINO_BACCARAT: 'casino_baccarat',
  CASINO_BACCARAT_LIVE: 'casino_baccarat_live',
  CASINO_SLOTS_TIGER: 'casino_slots_tiger',
  CASINO_SLOTS_GENERIC: 'casino_slots_generic',
  
  // 其他
  FUNNY: 'funny',
  DAILY: 'daily',
  NEWS: 'news'
} as const;

export const KEYWORD_TO_ASSET_TYPE = [
  {
    asset_type: 'nba',
    keywords: ['nba', 'basketball', 'lebron', 'curry', '籃球', '湖人', '勇士']
  },
  {
    asset_type: 'mlb',
    keywords: ['mlb', 'baseball', 'homerun', '大聯盟', '全壘打', '大谷', '洋基']
  },
  {
    asset_type: 'npb',
    keywords: ['npb', '日職', '日本職棒', '阪神', '巨人']
  },
  {
    asset_type: 'kbo',
    keywords: ['kbo', '韓職', '韓國職棒']
  },
  {
    asset_type: 'cpbl',
    keywords: ['cpbl', '中職', '中華職棒', '統一獅', '中信兄弟']
  },
  {
    asset_type: 'casino_baccarat',
    keywords: ['baccarat', 'banker', 'player', '百家樂', '路單', '長龍', '莊閑']
  },
  {
    asset_type: 'casino_baccarat_live',
    keywords: ['live baccarat', '真人百家樂', '視訊百家', 'dragon tiger']
  },
  {
    asset_type: 'casino_slots_tiger',
    keywords: ['虎機', '老虎機', 'slot machine', 'spin']
  },
  {
    asset_type: 'casino_slots_generic',
    keywords: ['電子遊戲', 'jackpot', '爆分', '免遊', 'megaways']
  },
  {
    asset_type: 'daily',
    keywords: ['省錢', 'CP值', '銅板價', '小資', '理財', '優惠', '特價', '團購']
  },
  {
    asset_type: 'funny',
    keywords: ['梗圖', '好笑', '迷因', 'meme', '趣事', '搞笑']
  },
  {
    asset_type: 'news',
    keywords: ['新聞', '快訊', '最新', '報導', '社會', '時事']
  }
];

import { KeywordEngine } from './keywordEngine';

// ... (KEEP CANONICAL_ASSET_TYPES and KEYWORD_TO_ASSET_TYPE if needed for legacy support, or refactor to use matrix)

// 檢測函數
export function detectAssetType(content: string, sourceUrl?: string): string {
  // Split content into terms (naive implementation)
  const terms = content.split(/[\s,]+/);
  
  // Use KeywordEngine to infer domain
  const domains = KeywordEngine.inferDomains(terms, 2); // Lower threshold for asset detection
  
  if (domains.length > 0 && domains[0] !== 'general') {
    // Map domain to primary asset type
    const domain = domains[0];
    switch (domain) {
      case 'sports_nba': return 'nba';
      case 'sports_mlb': return 'mlb';
      case 'sports_kbo': return 'kbo';
      case 'sports_npb': return 'npb';
      case 'sports_soccer': return 'soccer';
      case 'casino_baccarat': return 'casino_baccarat';
      case 'casino_slots': return 'casino_slots_tiger';
      case 'daily_life': return 'daily';
      case 'finance': return 'news';
      default: return 'generic';
    }
  }
  
  return 'generic';
}
