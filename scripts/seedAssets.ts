import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const mockAssets = [
  // NBA 類 (適合運彩老吳)
  {
    asset_type: 'nba',
    title: '湖人 vs 勇士：詹皇砍下 30 分大三元',
    description: 'LeBron James 全場掌控節奏，勇士外線失準。',
    content_url: 'https://images.unsplash.com/photo-1546519638-68e109498ee2?q=80&w=2090&auto=format&fit=crop',
    raw_content: '湖人今日主場迎戰勇士，LBJ 開場就展現強大企圖心，全場 30 分 10 籃板 11 助攻。Curry 手感冰冷，三分球 10 投僅 2 中。盤口原本開勇士讓 3.5 分，最後湖人倒打。',
    risk_level: 0,
    source_platform: 'rss',
    category: 'sports'
  },
  {
    asset_type: 'nba',
    title: '獨行俠交易傳聞：想補強內線防守',
    description: 'Mark Cuban 有意引進一名藍領中鋒。',
    content_url: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2069&auto=format&fit=crop',
    raw_content: '達拉斯獨行俠近期防守效率下滑，傳聞管理層正在尋求交易，目標鎖定東區某球隊的替補中鋒。這對之後的大小分盤口可能會有影響。',
    risk_level: 0,
    source_platform: 'twitter',
    category: 'sports'
  },
  {
    asset_type: 'nba',
    title: '金塊傷兵名單更新：Jokic 出戰成疑',
    description: '賽前決定是否上場，對賠率影響巨大。',
    content_url: 'https://images.unsplash.com/photo-1519861531473-920026393112?q=80&w=2076&auto=format&fit=crop',
    raw_content: 'Nikola Jokic 因為背部痠痛，今日對戰灰狼列為 GTD (Game Time Decision)。莊家目前暫時關盤，等待進一步消息。',
    risk_level: 1,
    source_platform: 'news',
    category: 'sports'
  },
  {
    asset_type: 'nba',
    title: '快艇主場連勝終止',
    description: '可愛缺陣，快艇進攻當機。',
    content_url: 'https://images.unsplash.com/photo-1533561052604-c3be19ad9607?q=80&w=1974&auto=format&fit=crop',
    raw_content: 'Kawhi Leonard 輪休，快艇進攻便秘，全場只得 95 分。對於追逐小分的玩家來說是一大利多。',
    risk_level: 0,
    source_platform: 'rss',
    category: 'sports'
  },
  {
    asset_type: 'nba',
    title: 'NBA 裁判報告：最後 2 分鐘兩次誤判',
    description: '聯盟承認錯誤，但比賽結果無法改變。',
    content_url: 'https://images.unsplash.com/photo-1574602305399-f3b1853600f6?q=80&w=2094&auto=format&fit=crop',
    raw_content: '昨日熱火對塞爾提克，裁判漏吹了一次關鍵犯規。這種人為因素是數據分析無法預測的變數。',
    risk_level: 1,
    source_platform: 'nba_official',
    category: 'sports'
  },

  // MLB 類 (適合運彩老吳)
  {
    asset_type: 'mlb',
    title: '大谷翔平二刀流再現：6 局 10K + 陽春砲',
    description: '現代神獸持續刷新紀錄。',
    content_url: 'https://images.unsplash.com/photo-1508344928928-716d868196f6?q=80&w=2067&auto=format&fit=crop',
    raw_content: '大谷翔平今日先發登板，主投 6 局無失分，還自己打了一支全壘打。道奇讓分盤輕鬆過關。',
    risk_level: 0,
    source_platform: 'rss',
    category: 'sports'
  },
  {
    asset_type: 'mlb',
    title: '洋基牛棚放火，單局丟 5 分遭逆轉',
    description: '守護神救援失敗，球迷崩潰。',
    content_url: 'https://images.unsplash.com/photo-1563205764-dc9e3ce07634?q=80&w=2070&auto=format&fit=crop',
    raw_content: '洋基 9 局上領先 3 分，結果終結者一上來就保送，接著被連續安打。这种剧本在MLB很常見，走地盤口波動極大。',
    risk_level: 0,
    source_platform: 'rss',
    category: 'sports'
  },

  // 百家樂/博弈類 (高風險，適合特定人設但需小心)
  {
    asset_type: 'casino_baccarat',
    title: '澳門賭場最新路單分析',
    description: '長閒龍出現，連續 12 把閒。',
    content_url: 'https://images.unsplash.com/photo-1605870445919-838d190e8e1b?q=80&w=2072&auto=format&fit=crop',
    raw_content: '昨日威尼斯人某桌出現傳奇長龍，連續 12 把開閒。許多老手都在這波賺翻。但切記，長龍隨時會斷，資金控管最重要。',
    risk_level: 3, // 風險較高
    source_platform: 'forum',
    category: 'casino'
  },
  {
    asset_type: 'casino_slots_tiger',
    title: '雷神之錘爆分影片瘋傳',
    description: '單把 5000 倍，玩家驚呼不可思議。',
    content_url: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=2070&auto=format&fit=crop',
    raw_content: '網路上流傳一段老虎機爆分影片，雖然看著很爽，但機率極低。建議當作娛樂就好，不要沉迷。',
    risk_level: 4, // 高風險
    source_platform: 'tiktok',
    category: 'casino'
  },

  // 生活/省錢類 (適合小資阿傑)
  {
    asset_type: 'daily',
    title: '全聯週末優惠：衛生紙買一送一',
    description: '婆婆媽媽快衝，限時兩天。',
    content_url: 'https://images.unsplash.com/photo-1580913428023-02c69e1a0132?q=80&w=2070&auto=format&fit=crop',
    raw_content: '全聯本週末推出衛生紙大促銷，平均一包不到 10 元。這是囤貨的好時機！',
    risk_level: 0,
    source_platform: 'rss',
    category: 'lifestyle'
  },
  {
    asset_type: 'daily',
    title: '星巴克買一送一券領取教學',
    description: '隱藏版活動，只要三個步驟。',
    content_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1974&auto=format&fit=crop',
    raw_content: '打開 APP，參加數位體驗，就有機會抽中全品項買一送一。小資族上班提神必備！',
    risk_level: 0,
    source_platform: 'app',
    category: 'lifestyle'
  },
  {
    asset_type: 'news',
    title: '央行升息半碼，房貸族壓力大增',
    description: '千萬房貸每年多繳好幾千。',
    content_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop',
    raw_content: '央行今日宣布升息，雖然是為了抑制通膨，但對背房貸的小資族來說無疑是雪上加霜。該如何理財應對？',
    risk_level: 0,
    source_platform: 'news',
    category: 'finance'
  },
  {
    asset_type: 'funny',
    title: '週一上班心情梗圖',
    description: '不想上班的眼神。',
    content_url: 'https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?q=80&w=1974&auto=format&fit=crop',
    raw_content: '這隻貓咪厭世的表情完全就是我星期一早上的寫照。Tag 你那位不想上班的同事。',
    risk_level: 0,
    source_platform: 'instagram',
    category: 'meme'
  },
  {
    asset_type: 'daily',
    title: '超商 65 折時段攻略',
    description: '友善時光地圖，晚餐省錢救星。',
    content_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974&auto=format&fit=crop',
    raw_content: '現在各超商都有即期品優惠，善用 APP 查詢庫存，晚餐可以省下 30-40% 的伙食費。',
    risk_level: 0,
    source_platform: 'blog',
    category: 'lifestyle'
  },

  // 更多混合類
  {
    asset_type: 'nba',
    title: '字母哥缺席，公鹿慘敗',
    description: 'Giannis 受傷，球隊失去重心。',
    content_url: 'https://images.unsplash.com/photo-1518407613690-d9fc990e795f?q=80&w=2070&auto=format&fit=crop',
    raw_content: '沒有字母哥的公鹿就像沒有牙齒的老虎。這場比賽可以看出他們板凳深度的不足。',
    risk_level: 0,
    source_platform: 'rss',
    category: 'sports'
  },
  {
    asset_type: 'mlb',
    title: '紅襪隊長受傷，需休息兩週',
    description: '打線缺口難以填補。',
    content_url: 'https://images.unsplash.com/photo-1595210329266-981c73a5a7dc?q=80&w=1974&auto=format&fit=crop',
    raw_content: '紅襪主砲拉傷大腿，預計缺席兩週。這段期間紅襪的得分能力令人擔憂。',
    risk_level: 0,
    source_platform: 'news',
    category: 'sports'
  },
  {
    asset_type: 'daily',
    title: 'Costco 必買清單 Top 10',
    description: '網友激推，回購率超高。',
    content_url: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?q=80&w=1974&auto=format&fit=crop',
    raw_content: '這十樣商品是 Costco 會員公認 CP 值最高的，包含烤雞、貝果和衛生紙。',
    risk_level: 0,
    source_platform: 'blog',
    category: 'lifestyle'
  },
  {
    asset_type: 'funny',
    title: '薪水入帳 vs 繳卡費',
    description: '過路財神的悲哀。',
    content_url: 'https://images.unsplash.com/photo-1579621970563-ebec7560eb3e?q=80&w=1925&auto=format&fit=crop',
    raw_content: '每個月最開心的時刻也是最心痛的時刻。薪水進來轉一圈就出去了。',
    risk_level: 0,
    source_platform: 'meme',
    category: 'meme'
  },
  {
    asset_type: 'news',
    title: '台股重挫 300 點，外資大逃殺',
    description: '股匯雙殺，投資人哀鴻遍野。',
    content_url: 'https://images.unsplash.com/photo-1611974765270-ca1258822981?q=80&w=1974&auto=format&fit=crop',
    raw_content: '受美股影響，台股今日開低走低，電子股成為重災區。定期定額的存股族建議堅持扣款，不要恐慌。',
    risk_level: 0,
    source_platform: 'news',
    category: 'finance'
  },
  {
    asset_type: 'casino_baccarat',
    title: '百家樂心態管理：止盈止損',
    description: '贏了要跑，輸了要停。',
    content_url: 'https://images.unsplash.com/photo-1518893494013-481c1d8ed3fd?q=80&w=2070&auto=format&fit=crop',
    raw_content: '很多人輸錢不是因為運氣不好，是因為貪心。設定好今天的目標，達到了就關機睡覺。',
    risk_level: 2,
    source_platform: 'blog',
    category: 'casino'
  }
];

async function seedAssets() {
  console.log('Seeding mock assets...');
  
  for (const asset of mockAssets) {
    const { error } = await supabase.from('assets').insert({
      ...asset,
      status: 'new',
      created_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString() // Random time within last 7 days
    });

    if (error) {
      console.error(`Failed to insert ${asset.title}:`, error.message);
    } else {
      console.log(`Inserted: ${asset.title}`);
    }
  }

  console.log('Done!');
  process.exit(0);
}

seedAssets();
