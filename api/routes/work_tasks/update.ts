import express, { type Request, type Response } from 'express';
import getSupabaseClient from '../../supabaseClient';

const router = express.Router({ mergeParams: true });

// PUT /api/work_tasks/:id
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const updates = req.body;

    // Validate fields if necessary
    // Allowed fields to update
    const allowedFields = ['post_url', 'notes', 'status', 'content_text', 'payload'];
    const filteredUpdates: any = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    const { data, error } = await supabase
      .from('work_tasks')
      .update(filteredUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ ok: true, data });
  } catch (error: any) {
    console.error('Update Task Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
