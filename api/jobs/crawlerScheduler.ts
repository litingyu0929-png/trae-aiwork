import cron from 'node-cron';
import { CrawlerEngine } from '../services/crawlerEngine.js';

export function startCrawlerCron() {
  // 每 24 小時執行一次 (0 0 * * *)
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ [Cron] Starting Daily Crawler...');
    try {
      await CrawlerEngine.run();
    } catch (error) {
      console.error('⏰ [Cron] Crawler Failed:', error);
    }
  });
  
  console.log('✅ Crawler Cron Job Scheduled (Daily)');
}
