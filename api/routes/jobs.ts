import express, { type Request, type Response } from 'express';
import getSupabaseClient from '../supabaseClient';
import cron from 'node-cron';

const router = express.Router();
// Use service role key for cron jobs

// ===== 主函數：生成今日任務 =====
export async function generateDailyTasks() {
  const targetDate = new Date().toISOString().split('T')[0];
  
  console.log(`🚀 [${new Date().toISOString()}] 開始生成 ${targetDate} 的任務...`);
  
  try {
    const supabase = getSupabaseClient();
    // 1. 讀取所有啟用的模板
    const { data: templates, error: templatesError } = await supabase
      .from('task_templates')
      .select('*')
      .eq('enabled', true)
      .order('time_slot', { ascending: true });
    
    if (templatesError) throw templatesError;
    if (!templates || templates.length === 0) {
      console.log('⚠️  沒有啟用的任務模板');
      return { count: 0, skipped: 0 };
    }
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const template of templates) {
      // 2. 檢查今天是否該執行
      if (!shouldRunToday(template.frequency, targetDate)) {
        console.log(`⏭️  跳過（頻率不符）: ${template.task_type}`);
        skippedCount++;
        continue;
      }
      
      // 3. 檢查規則（例如：今天是否有 NBA 比賽）
      if (template.rule) {
        const ruleCheck = await checkRule(template.rule, targetDate);
        if (!ruleCheck) {
          console.log(`⏭️  跳過（規則不符）: ${template.task_type}`);
          skippedCount++;
          continue;
        }
      }
      
      // 4. 檢查是否已建立（防重複）
      // Note: time_slot in template is like "09:00", we create a key like "slot_0900"
      const timeSlotKey = `slot_${template.time_slot.replace(/:/g, '')}`;
      
      const { data: existing } = await supabase
        .from('daily_tasks')
        .select('id')
        .eq('persona_id', template.persona_id)
        .eq('task_date', targetDate)
        .eq('time_slot', timeSlotKey)
        .eq('sequence', template.sequence || 0)
        .maybeSingle();
      
      if (existing) {
        console.log(`⏭️  跳過（已存在）: ${template.task_type} @ ${template.time_slot}`);
        skippedCount++;
        continue;
      }
      
      // 5. ✅ 建立任務（不配對素材、不生成內容）
      const { error: insertError } = await supabase.from('daily_tasks').insert({
        persona_id: template.persona_id,
        task_type: template.task_type,
        task_date: targetDate,
        scheduled_time: template.time_slot, // Should be "HH:MM:SS" or "HH:MM"
        time_slot: timeSlotKey,
        sequence: template.sequence || 0,
        status: 'pending'
        // asset_id: null  ← 員工點「生成」時才配對
        // content_text: null  ← 員工點「生成」時才產生
      });
      
      if (insertError) {
        console.error(`❌ 建立失敗: ${template.task_type}`, insertError);
      } else {
        console.log(`✅ 建立成功: ${template.task_type} @ ${template.time_slot}`);
        createdCount++;
      }
    }
    
    console.log(`🎉 完成！建立 ${createdCount} 個任務，跳過 ${skippedCount} 個`);
    return { count: createdCount, skipped: skippedCount };
    
  } catch (error) {
    console.error('❌ 生成任務失敗:', error);
    throw error;
  }
}

// ===== 輔助函數：判斷今天是否該執行 =====
function shouldRunToday(frequency: string, date: string): boolean {
  const dayOfWeek = new Date(date).getDay(); // 0=週日, 1=週一, ..., 6=週六
  
  switch (frequency) {
    case 'daily':
      return true;
    
    case 'weekday':  // 週一到週五
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    
    case 'weekend':  // 週六週日
      return dayOfWeek === 0 || dayOfWeek === 6;
    
    case 'match_day':  // 有比賽的日子（需要額外查詢）
      // TODO: 串接賽事 API 查詢今天是否有比賽
      return true;  // 暫時都執行
    
    default:
      return false;
  }
}

// ===== 輔助函數：檢查規則 =====
async function checkRule(rule: any, date: string): Promise<boolean> {
  // 範例：檢查今天 NBA 比賽是否 >= 2 場
  if (rule.min_matches) {
    // TODO: 呼叫賽事 API 查詢
    // const matchCount = await getMatchCount(date, rule.sport);
    // return matchCount >= rule.min_matches;
    return true;  // 暫時都通過
  }
  
  return true;
}

// ===== 啟動 Cron（每天凌晨 3:00 執行）=====
export function startDailyTasksCron() {
  cron.schedule('0 3 * * *', () => {
    console.log('⏰ Cron 觸發：開始生成今日任務...');
    generateDailyTasks();
  });
  
  console.log('✅ Cron Job 已啟動（每天 03:00 執行）');
}

// ===== API 路由 =====

// Manual trigger
export async function manualTrigger() {
  console.log('🧪 手動觸發任務生成...');
  return await generateDailyTasks();
}

router.post('/generate-tasks', async (req: Request, res: Response) => {
  try {
    const result = await manualTrigger();
    return res.json({ 
      ok: true, 
      message: '任務生成完成', 
      ...result
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Legacy route support (optional)
router.post('/init_daily_tasks', async (req: Request, res: Response) => {
  try {
    const result = await generateDailyTasks();
    return res.json({ 
      ok: true, 
      message: 'Tasks initialized', 
      ...result
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

import { CrawlerEngine } from '../services/crawlerEngine';

// ... 略 ...

router.post('/crawl-now', async (req: Request, res: Response) => {
  try {
    const results = await CrawlerEngine.run();
    res.json({ ok: true, message: '爬蟲執行完成', results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
