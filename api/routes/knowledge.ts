import express from 'express';
import getSupabaseClient from '../supabaseClient.js';

const router = express.Router();

// GET all phrases
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create phrase
router.post('/', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { category, content, tags } = req.body;
    
    if (!category || !content) {
      return res.status(400).json({ success: false, error: 'Category and content are required' });
    }

    const { data, error } = await supabase
      .from('knowledge_base')
      .insert([{ category, content, tags: tags || [] }])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update phrase
router.put('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { category, content, tags } = req.body;

    const { data, error } = await supabase
      .from('knowledge_base')
      .update({ category, content, tags, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE phrase
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
