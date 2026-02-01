import express, { type Request, type Response } from 'express';
import { CrawlerEngine } from '../services/crawlerEngine.js';
import getSupabaseClient from '../supabaseClient.js';

const router = express.Router();

// 取得爬蟲狀態與日誌
router.get('/status', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    // 1. 取得所有 Feed 狀態
    const { data: feeds } = await supabase
      .from('rss_feeds')
      .select('*')
      .order('last_fetched_at', { ascending: false });

    // 2. 取得最近的執行日誌 (取前 20 筆)
    const { data: logs } = await supabase
      .from('crawler_logs')
      .select(`
        *,
        rss_feeds (name, url)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    res.json({ 
      feeds: feeds || [], 
      recent_logs: logs || [] 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 手動觸發爬蟲
router.post('/run', async (req: Request, res: Response) => {
  try {
    const results = await CrawlerEngine.run();
    res.json({ ok: true, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 新增 Feed
router.post('/feeds', async (req: Request, res: Response) => {
  try {
    const { name, url, category } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }
    
    const feed = await CrawlerEngine.addFeed(name, url, category);
    res.status(201).json({ ok: true, feed });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: '此 RSS URL 已存在，請勿重複新增' });
    }
    res.status(500).json({ error: error.message });
  }
});

// 更新 Feed
router.put('/feeds/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { name, url, category, is_active } = req.body;
    
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (url !== undefined) updates.url = url;
    if (category !== undefined) updates.category = category;
    if (is_active !== undefined) updates.is_active = is_active;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('rss_feeds')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ ok: true, feed: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 刪除 Feed
router.delete('/feeds/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    
    // 先刪除相關 logs (如果有 foreign key constraint 未設 cascade)
    // 假設 DB 有設定 cascade 或我們先手動刪除
    await supabase.from('crawler_logs').delete().eq('feed_id', id);

    const { error } = await supabase
      .from('rss_feeds')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
