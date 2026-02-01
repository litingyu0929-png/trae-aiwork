import express, { type Request, type Response } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import getSupabaseClient from '../supabaseClient';

const router = express.Router();

// Get all logs (Admin only)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { page = 1, limit = 50 } = req.query;
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    const { data, count, error } = await supabase
      .from('system_logs')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.json({ data, count, page, limit });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
