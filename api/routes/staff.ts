import express, { type Request, type Response } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import getSupabaseClient from '../supabaseClient.js';

const router = express.Router();

// GET /api/team/mine - Get assignments for the current user
router.get('/mine', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { user_id } = req.query; // Assuming passed from frontend or middleware
    
    if (!user_id) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    // 1. Fetch Profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileError) throw profileError;

    // 2. Fetch Assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('staff_persona_assignments')
      .select('persona:personas(*)')
      .eq('staff_id', user_id);

    if (assignmentsError) throw assignmentsError;

    const assignedPersonas = assignments?.map((a: any) => a.persona) || [];
    const personaIds = assignedPersonas.map((p: any) => p.id);

    // 3. Fetch Accounts for these personas
    let assignedAccounts: any[] = [];
    if (personaIds.length > 0) {
        const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .in('persona_id', personaIds);
        
        if (accountsError) throw accountsError;
        assignedAccounts = accounts || [];
    }
    
    // Also fetch accounts directly assigned to staff (if any legacy/direct assignment exists)
    const { data: directAccounts, error: directAccountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('assigned_to', user_id);
    
    if (!directAccountsError && directAccounts) {
        // Merge and deduplicate
        const existingIds = new Set(assignedAccounts.map(a => a.id));
        directAccounts.forEach(acc => {
            if (!existingIds.has(acc.id)) {
                assignedAccounts.push(acc);
            }
        });
    }

    console.log(`[API] /team/mine for ${user_id}: Found ${assignedAccounts.length} accounts.`);
    console.log('[API] Account IDs:', assignedAccounts.map(a => a.id));
    console.log('[API] Account Personas:', assignedAccounts.map(a => a.persona_id));

    res.json({
      success: true,
      data: {
        profile,
        assigned_personas: assignedPersonas,
        assigned_accounts: assignedAccounts
      }
    });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/team - List all staff (Admin/Leader only)
router.get('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { role } = req.query; // Filter by role if needed

    let query = supabase
      .from('profiles')
      .select('*, staff_persona_assignments(id, persona:personas(id, name))')
      .neq('role', 'admin') // Usually admins manage staff, but don't assign themselves
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // Transform data to include assigned personas count or names
    const transformedData = data?.map(staff => ({
      ...staff,
      // Flatten the nested structure: staff_persona_assignments -> persona
      assigned_personas: staff.staff_persona_assignments
        ?.map((a: any) => a.persona)
        .filter((p: any) => p !== null) || [] // Filter out nulls if any join failed
    }));

    res.json({ success: true, data: transformedData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/team/assign - Assign persona to staff
router.post('/assign', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { staff_id, persona_ids, assigned_by } = req.body;

    if (!staff_id || !Array.isArray(persona_ids)) {
      return res.status(400).json({ success: false, error: 'Invalid payload' });
    }

    // 1. Get current assignments to identify what is being removed
    const { data: currentAssignments } = await supabase
        .from('staff_persona_assignments')
        .select('persona_id')
        .eq('staff_id', staff_id);
    
    const currentIds = currentAssignments?.map((a: any) => a.persona_id) || [];
    const newIds = persona_ids;
    
    // Find personas that are being unassigned
    const removedIds = currentIds.filter(id => !newIds.includes(id));

    // 2. Handle Removed Personas: Clear account assignments
    if (removedIds.length > 0) {
        // Only clear if they are currently assigned to THIS staff
        await supabase
            .from('accounts')
            .update({ assigned_to: null })
            .in('persona_id', removedIds)
            .eq('assigned_to', staff_id);
    }

    // 3. Remove existing assignments for this staff (Full sync mode)
    const { error: deleteError } = await supabase
      .from('staff_persona_assignments')
      .delete()
      .eq('staff_id', staff_id);

    if (deleteError) throw deleteError;

    // 4. Insert new assignments
    if (persona_ids.length > 0) {
      // 4.1 First, ensure these personas are NOT assigned to anyone else (Steal them)
      const { error: cleanupError } = await supabase
        .from('staff_persona_assignments')
        .delete()
        .in('persona_id', persona_ids);
      
      if (cleanupError) throw cleanupError;

      // 4.2 Insert new assignments
      const assignments = persona_ids.map(pid => ({
        staff_id,
        persona_id: pid
      }));

      const { error: insertError } = await supabase
        .from('staff_persona_assignments')
        .insert(assignments);

      if (insertError) throw insertError;

      // 4.3 SYNC: Update all accounts belonging to these personas to be assigned to this staff
      const { error: accountSyncError } = await supabase
        .from('accounts')
        .update({ assigned_to: staff_id })
        .in('persona_id', persona_ids);

      if (accountSyncError) throw accountSyncError;
    }

    // 5. Log this action
    await supabase.from('system_logs').insert({
      level: 'info',
      action_type: 'staff_assignment_update',
      user_id: assigned_by || 'system',
      details: { staff_id, assigned_personas: persona_ids, removed_personas: removedIds },
      ip_address: req.ip || '0.0.0.0'
    });

    res.json({ success: true, message: 'Assignments updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/team/:id - Update staff details (role, type, status)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { role, staff_type, full_name } = req.body;

    const updates: any = {};
    if (role) updates.role = role;
    if (staff_type) updates.staff_type = staff_type;
    if (full_name) updates.full_name = full_name;

    const { data, error } = await supabase
      .from('profiles')
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

// PUT /api/team/:id/reset-password - Reset staff password
router.put('/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const { error } = await supabase.auth.admin.updateUserById(id, {
      password: password
    });

    if (error) throw error;

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/team/:id - Delete staff
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    // 1. Unassign accounts
    const { error: accountError } = await supabase
      .from('accounts')
      .update({ assigned_to: null })
      .eq('assigned_to', id);
    if (accountError) throw accountError;

    // 2. Delete assignments
    const { error: assignError } = await supabase
      .from('staff_persona_assignments')
      .delete()
      .eq('staff_id', id);
    if (assignError) throw assignError;

    // 3. Delete tasks (or set to null, but usually delete for staff-specific tasks)
    // Note: If tasks are critical history, maybe keep them but set staff_id null if allowed.
    // Assuming work_tasks.staff_id is NOT NULL or we want to clean up.
    // Let's delete future tasks, keep past? Simpler to just delete all or let cascade handle if configured.
    // For now, let's explicit delete to avoid FK errors if cascade isn't set.
    const { error: taskError } = await supabase
      .from('work_tasks')
      .delete()
      .eq('staff_id', id);
    if (taskError) throw taskError;

    // 4. Delete profile (Public)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    if (profileError) throw profileError;

    // 5. Delete auth user (Service Role required)
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) {
        console.warn('Failed to delete auth user, but profile deleted:', authError);
        // Don't fail the request if only auth deletion fails (maybe already gone)
    }

    res.json({ success: true, message: 'Staff deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/team/proxy-bind - Log and validate proxy binding
router.post('/proxy-bind', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { proxy_user_id, target_user_id } = req.body;

    if (!proxy_user_id || !target_user_id) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    // 1. Validate permissions (Optional: Check if proxy_user is admin/leader)
    const { data: proxyUser, error: proxyError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', proxy_user_id)
      .single();

    if (proxyError || !proxyUser) {
      return res.status(403).json({ success: false, error: 'Invalid proxy user' });
    }

    // 2. Log the binding
    const { error: logError } = await supabase
      .from('proxy_logs')
      .insert({
        proxy_user_id,
        target_user_id,
        action_type: 'bind',
        metadata: {
            timestamp: new Date().toISOString(),
            source: 'web_client'
        }
      });

    if (logError) throw logError;

    // 3. Return success (Frontend will handle the session state update)
    res.json({ success: true, message: 'Proxy binding logged successfully' });
  } catch (error: any) {
    console.error('Proxy bind error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
