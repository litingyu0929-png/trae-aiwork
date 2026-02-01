import Parser from 'rss-parser';
import { detectAssetType } from '../../src/lib/assetTypeMapping';
import { translateContent } from './AIService';
import getSupabaseClient from '../supabaseClient';

const parser = new Parser();

export class CrawlerEngine {
  /**
   * 執行一次完整的爬蟲任務
   */
  static async run() {
    console.log('🕷️ Crawler Engine Started...');
    const supabase = getSupabaseClient();
    
    // 1. 獲取所有活躍的 RSS Feeds
    const { data: feeds, error: feedsError } = await supabase
      .from('rss_feeds')
      .select('*')
      .eq('is_active', true);

    if (feedsError) throw feedsError;

    const results = [];

    // 2. 遍歷每個 Feed 進行抓取
    for (const feed of feeds || []) {
      try {
        const feedContent = await parser.parseURL(feed.url);
        let newItemsCount = 0;

        // 3. 處理每個項目
        for (const item of feedContent.items) {
          if (!item.link) continue;

          // 檢查是否已存在
          const { data: existing } = await supabase
            .from('assets')
            .select('id')
            .eq('source_url', item.link)
            .single();

          if (!existing) {
            // 自動分類
            const assetType = detectAssetType(item.title + ' ' + (item.contentSnippet || ''));
            
            // 翻譯標題與內容 (Translation)
            const translatedTitle = await translateContent(item.title || '');
            const translatedDescription = await translateContent(item.contentSnippet || item.content || '');
            // const translatedTitle = item.title || ''; // Fallback
            // const translatedDescription = item.contentSnippet || item.content || ''; // Fallback

            // 寫入 assets 表
            await supabase.from('assets').insert({
              asset_type: assetType,
              source_platform: 'rss',
              source_url: item.link,
              title: translatedTitle, // 儲存繁體中文標題
              description: translatedDescription, // 儲存繁體中文摘要
              raw_content: item.content || item.contentSnippet, // 保留原始內容
              processed_content: translatedDescription, // 預處理內容也使用翻譯後的摘要
              category: feed.category || 'general',
              sub_category: item.categories?.[0] || '', 
              status: 'new',
              created_at: new Date(item.pubDate || new Date()).toISOString(),
              risk_level: 0, 
            });
            newItemsCount++;
          }
        }

        // 更新 Feed 的最後抓取時間
        await supabase
          .from('rss_feeds')
          .update({ last_fetched_at: new Date().toISOString() })
          .eq('id', feed.id);

        // 記錄 Log
        await supabase.from('crawler_logs').insert({
          feed_id: feed.id,
          status: 'success',
          items_fetched: newItemsCount
        });

        results.push({ feed: feed.name, new_items: newItemsCount, status: 'success' });

      } catch (feedError: any) {
        console.error(`Failed to fetch feed ${feed.url}:`, feedError);
        
        await supabase.from('crawler_logs').insert({
          feed_id: feed.id,
          status: 'failed',
          error_message: feedError.message
        });

        results.push({ feed: feed.name, status: 'failed', error: feedError.message });
      }
    }

    console.log('🕷️ Crawler Engine Finished:', results);
    return results;
  }

  /**
   * 新增 RSS Feed
   */
  static async addFeed(name: string, url: string, category: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('rss_feeds')
      .insert({ name, url, category })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
