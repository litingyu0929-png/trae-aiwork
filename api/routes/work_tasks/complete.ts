import express, { type Request, type Response } from 'express';
import getSupabaseClient from '../../supabaseClient';

const router = express.Router({ mergeParams: true });

router.post('/:id/complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { post_url } = req.body ?? {};

    // 1. 更新任務狀態
    const { data: task, error: taskError } = await supabase
      .from('work_tasks')
      .update({
        status: 'completed',
        post_url: typeof post_url === 'string' && post_url.length > 0 ? post_url : null,
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (taskError) throw taskError;

    // 2. 更新素材的 last_used_at（觸發冷卻）
    if (task.assigned_asset_id) {
      await supabase
        .from('assets')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', task.assigned_asset_id);
    }

    res.status(200).json({
      ok: true,
      task
    });

  } catch (error: any) {
    console.error('Complete Task Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
