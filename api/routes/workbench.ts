import express, { type Request, type Response } from 'express';
import getSupabaseClient from '../supabaseClient';

const router = express.Router();

// GET /api/workbench/my_personas
router.get('/my_personas', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    // Mock data for now or fetch from DB
    // In a real implementation, we would fetch personas assigned to the current user
    const { data: personas, error } = await supabase
      .from('personas')
      .select('*');

    if (error) throw error;

    // Enrich with task counts (mocked for now)
    const enrichedPersonas = personas.map(p => ({
      ...p,
      today_tasks: Math.floor(Math.random() * 10),
      urgent_tasks: Math.floor(Math.random() * 3)
    }));

    res.json({ personas: enrichedPersonas });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/workbench/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const supabase = getSupabaseClient();
    const { data: persona, error } = await supabase
      .from('personas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json({ data: persona });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
