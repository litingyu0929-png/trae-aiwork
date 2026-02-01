import express, { type Request, type Response } from 'express';
import getSupabaseClient from '../supabaseClient.js';

const router = express.Router();

// GET /api/personas - List all personas
router.get('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data: personas, error } = await supabase
      .from('personas')
      .select('*, staff_persona_assignments(staff_id, profiles(id, full_name, avatar_url)), accounts(id, platform, account_name, status)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data to make it easier to consume
    const transformedData = personas.map((p: any) => ({
        ...p,
        assigned_staff: p.staff_persona_assignments?.map((spa: any) => spa.profiles).filter(Boolean) || []
    }));

    res.json({ success: true, data: transformedData });
  } catch (error: any) {
    console.error('Error fetching personas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/personas/:id/assign - Assign persona to staff
router.post('/:id/assign', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { staff_id } = req.body; // If null, it means unassign

        const supabase = getSupabaseClient();

        // 1. Remove existing assignments for this persona (Assuming single owner for now)
        const { error: deleteError } = await supabase
            .from('staff_persona_assignments')
            .delete()
            .eq('persona_id', id);

        if (deleteError) throw deleteError;

        // 2. If staff_id provided, create new assignment
        if (staff_id) {
            const { error: insertError } = await supabase
                .from('staff_persona_assignments')
                .insert({
                    persona_id: id,
                    staff_id: staff_id
                });
            
            if (insertError) throw insertError;

            // 3. SYNC: Update all accounts belonging to this persona
            const { error: accountSyncError } = await supabase
                .from('accounts')
                .update({ assigned_to: staff_id })
                .eq('persona_id', id);
            
            if (accountSyncError) throw accountSyncError;
        } else {
            // Unassigned: Clear assigned_to for accounts
            const { error: accountSyncError } = await supabase
                .from('accounts')
                .update({ assigned_to: null })
                .eq('persona_id', id);
            
            if (accountSyncError) throw accountSyncError;
        }

        res.json({ success: true, message: 'Assignment updated' });
    } catch (error: any) {
        console.error('Error assigning persona:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/personas - Create new persona
router.post('/', async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      description, 
      tone, 
      role_category, 
      matrix_type, 
      persona_state,
      gender 
    } = req.body;
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('personas')
      .insert([{
        name,
        description,
        tone,
        role_category,
        matrix_type: matrix_type || 'traffic',
        persona_state: persona_state || 'growth',
        gender: gender || 'neutral'
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating persona:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/personas/:id - Update persona
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('personas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating persona:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/personas/:id - Delete persona
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    
    const { error } = await supabase
      .from('personas')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting persona:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
