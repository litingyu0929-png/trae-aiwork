
import { Router } from 'express';
import getSupabaseClient from '../supabaseClient';

const router = Router();

// Get my notifications
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    // Disable caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark as read
router.put('/:id/read', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { data, error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('id', id)
      .select();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark all as read
router.put('/read-all', async (req, res) => {
    try {
      const supabase = getSupabaseClient();
      const { userId } = req.body;
      if (!userId) {
          return res.status(400).json({ success: false, error: 'User ID is required' });
      }
  
      const { data, error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('recipient_id', userId)
        .eq('status', 'unread')
        .select();
  
      if (error) throw error;
  
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

export default router;
