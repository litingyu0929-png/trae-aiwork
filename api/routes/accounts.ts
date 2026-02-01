import express, { type Request, type Response } from 'express';
import getSupabaseClient from '../supabaseClient.js';

const router = express.Router();

// GET /api/accounts - List all accounts
router.get('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select(`
        *,
        assigned_staff:profiles(id, full_name, avatar_url),
        persona:personas(id, name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: accounts });
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/accounts/staff - List potential staff for assignment
router.get('/staff', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data: staff, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url')
      .order('full_name');

    if (error) throw error;

    res.json({ success: true, data: staff });
  } catch (error: any) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/accounts - Create new account
router.post('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { platform, account_name, account_handle, status, assigned_to, persona_id, login_credentials } = req.body;
    
    // SYNC LOGIC: If persona_id is provided, assigned_to MUST match the persona's owner
    let final_assigned_to = assigned_to;
    
    if (persona_id) {
        const { data: assignment } = await supabase
            .from('staff_persona_assignments')
            .select('staff_id')
            .eq('persona_id', persona_id)
            .single();
        
        // If persona has an owner, force assignment to that owner
        // If no owner, it remains as is (or null if we want strictness, but let's allow manual override if unassigned)
        if (assignment) {
            final_assigned_to = assignment.staff_id;
        } else {
             // If persona is unassigned, account should probably be unassigned too to avoid confusion
             // But maybe the user is setting up the account first? 
             // Let's strictly enforce: No owner for persona = No owner for account
             final_assigned_to = null;
        }
    }

    // Determine onboarding status
    const onboarding_status = final_assigned_to ? 'notified' : 'assigned';

    const { data, error } = await supabase
      .from('accounts')
      .insert([{
        platform,
        account_name,
        account_handle,
        status: status || 'active',
        assigned_to: final_assigned_to || null,
        persona_id: persona_id || null,
        login_credentials: login_credentials || {},
        onboarding_status
      }])
      .select()
      .single();

    if (error) throw error;

    // Send notification if assigned
    if (assigned_to) {
      await supabase.from('notifications').insert({
        recipient_id: assigned_to,
        type: 'account_assignment',
        title: '新帳號指派通知',
        content: {
          account_id: data.id,
          account_name: data.account_name,
          platform: data.platform,
          message: '您已被指派負責此帳號，請盡快完成綁定與人設設定。'
        },
        status: 'unread' // Ensure status is set
      });
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating account:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/accounts/:id - Update account
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { platform, account_name, account_handle, status, assigned_to, persona_id, login_credentials } = req.body;
    
    // SYNC LOGIC: If persona_id is provided (or changed), enforce owner sync
    let final_assigned_to = assigned_to;
    
    if (persona_id) {
         const { data: assignment } = await supabase
            .from('staff_persona_assignments')
            .select('staff_id')
            .eq('persona_id', persona_id)
            .single();
        
        if (assignment) {
            final_assigned_to = assignment.staff_id;
        } else {
            final_assigned_to = null;
        }
    }

    // Check if assignment changed
    const { data: current } = await supabase
      .from('accounts')
      .select('assigned_to, onboarding_status')
      .eq('id', id)
      .single();

    let onboarding_status = current?.onboarding_status;
    let shouldNotify = false;

    if (final_assigned_to && final_assigned_to !== current?.assigned_to) {
      onboarding_status = 'notified';
      shouldNotify = true;
    }

    const { data, error } = await supabase
      .from('accounts')
      .update({
        platform,
        account_name,
        account_handle,
        status,
        assigned_to: final_assigned_to || null,
        persona_id: persona_id || null,
        login_credentials,
        onboarding_status
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Send notification if newly assigned
    if (shouldNotify && final_assigned_to) {
      await supabase.from('notifications').insert({
        recipient_id: final_assigned_to,
        type: 'account_assignment',
        title: '帳號指派變更通知',
        content: {
          account_id: data.id,
          account_name: data.account_name,
          platform: data.platform,
          message: '您已被指派負責此帳號，請盡快完成綁定與人設設定。'
        }
      });
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating account:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/accounts/:id/bind - Bind persona to account (Bypass RLS)
router.post('/:id/bind', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { persona_id } = req.body;

    if (!persona_id) {
        return res.status(400).json({ success: false, error: 'Persona ID is required' });
    }

    const { data, error } = await supabase
      .from('accounts')
      .update({
        persona_id,
        onboarding_status: 'completed'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error binding account:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/accounts/:id - Delete account
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
