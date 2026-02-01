import express, { type Request, type Response } from 'express';
import getSupabaseClient from '../supabaseClient';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

// Get all templates (Public access for now, or add auth if needed)
router.get('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('task_templates')
      .select('*, personas(name)')
      .order('time_slot', { ascending: true });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new template
router.post('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { task_type, time_slot, priority, persona_id, rule, frequency, enabled } = req.body;
    
    const { data, error } = await supabase
      .from('task_templates')
      .insert({
        task_type,
        time_slot,
        priority,
        persona_id,
        rule,
        frequency,
        enabled: enabled !== undefined ? enabled : true
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update template
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('task_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete template
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    
    const { error } = await supabase
      .from('task_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
