import express, { type Request, type Response } from 'express';
import getSupabaseClient from '../supabaseClient.js';

const router = express.Router();

/**
 * GET /api/runbook/today
 * Fetch today's runbook data for a specific staff member.
 * Returns tasks and the account/persona mapping for the matrix view.
 */
router.get('/today', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const { staff_id, date } = req.query;

    if (!staff_id || !date) {
      res.status(400).json({ error: 'Missing required fields: staff_id, date' });
      return;
    }

    const targetDate = date as string;
    const targetStaffId = staff_id as string;

    // 1. Fetch Tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('work_tasks')
      .select(`
        *,
        persona:personas(id, name),
        account:accounts(id, account_name, account_handle, platform)
      `)
      .eq('task_date', targetDate)
      .eq('staff_id', targetStaffId)
      .order('scheduled_time', { ascending: true });

    if (tasksError) throw tasksError;

    // 2. Fetch Accounts Map (All assignments for this staff)
    // This ensures we show columns for personas even if they have no tasks today
    const { data: assignments, error: assignmentsError } = await supabase
      .from('staff_persona_assignments')
      .select(`
        account_id,
        persona_id,
        account:accounts(id, account_name, account_handle, platform),
        persona:personas(id, name)
      `)
      .eq('staff_id', targetStaffId);

    if (assignmentsError) throw assignmentsError;

    // Fix: If no assignments found, fetch all personas to at least show columns for Admin
    let finalAssignments = assignments || [];
    
    // If Admin is viewing, but targetStaffId has no assignments (maybe tasks were assigned directly without persona link?)
    // Or if we just want to see all tasks regardless of persona assignment table
    // But for now, let's trust the assignment table.
    
    // HOWEVER, if the staff has tasks for a persona that is NOT in the assignment table (e.g. manual task),
    // we should still show that persona column.
    const taskPersonaIds = new Set(tasks?.map(t => t.persona_id).filter(id => id) || []);
    
    // Add missing personas from tasks to the map
    if (tasks && tasks.length > 0) {
        for (const task of tasks) {
            if (task.persona_id && !finalAssignments.some(a => a.persona_id === task.persona_id)) {
                // Fetch persona details if missing
                 const { data: p } = await supabase.from('personas').select('id, name').eq('id', task.persona_id).single();
                 if (p) {
                     finalAssignments.push({
                         account_id: task.account_id,
                         persona_id: task.persona_id,
                         account: task.account, // might be partial
                         persona: p
                     } as any);
                 }
            }
        }
    }

    // Format accounts_map for frontend
    const accounts_map = finalAssignments.map(a => ({
      account_id: a.account_id,
      persona_id: a.persona_id,
      account: a.account,
      persona: a.persona
    }));

    res.json({
      success: true,
      data: {
        tasks: tasks || [],
        accounts_map
      }
    });

  } catch (error: any) {
    console.error('Get Runbook Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Generate daily tasks including Ops tasks
 * POST /api/runbook/generate-daily
 */
router.post('/generate-daily', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const { staff_id, date, role_type: explicitRoleType } = req.body; 

    if (!staff_id || !date) {
      res.status(400).json({ error: 'Missing required fields: staff_id, date' });
      return;
    }

    // 0. Determine Role Type from DB if not provided explicitly
    let role_type = explicitRoleType;
    if (!role_type) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('staff_type')
        .eq('id', staff_id)
        .single();
      
      if (profileError) {
        throw new Error('Failed to fetch staff profile: ' + profileError.message);
      }
      // role_type = profile.staff_type === 'closer' ? 'specialist' : 'operator';
      // Force default to specialist for now as we removed the switcher
      role_type = 'specialist';
    }

    // 1. Get Accounts and Personas assigned to this staff
    const { data: assignments, error: assignmentError } = await supabase
        .from('staff_persona_assignments')
        .select('account_id, persona_id')
        .eq('staff_id', staff_id);

    if (assignmentError) {
        throw new Error('Failed to fetch assignments: ' + assignmentError.message);
    }

    const accountIds = assignments?.map(a => a.account_id) || [];
    const personaIds = assignments?.map(a => a.persona_id) || [];
    
    // If no specific account assigned, we might need a default or error. 
    // For now, let's assume if no account, we pick one random or handle it gracefully.
    // Ideally, Ops tasks might not be account-specific (like 'admin'), but some are (like 'reply').
    // We will generate tasks. If account-specific, we replicate for accounts or pick one.
    // For simplicity in this iteration, we'll assign to the first account found or null if global.
    const primaryAccountId = accountIds[0] || null;
    const primaryPersonaId = personaIds[0] || null;

    if (!primaryPersonaId) {
       // Try to find ANY persona to attach to (required by DB schema)
       const { data: anyPersona } = await supabase.from('personas').select('id').limit(1).single();
       if (!anyPersona) {
         throw new Error('No personas found in system to assign task to.');
       }
       // We'll use this fallback persona ID
       // In production, we should ensure staff has assignments or use a "System Admin" persona
       // For now, we mutate the variable to avoid TS errors if we were strictly typed, but here it's fine.
    }
    
    const finalPersonaId = primaryPersonaId || (await supabase.from('personas').select('id').limit(1).single()).data?.id;


    // 2. Define SOP Logic (From DB Templates)
    let opsTasks: any[] = [];
    
    // Fetch active templates
    const { data: templates, error: templateError } = await supabase
      .from('task_templates')
      .select('*')
      .eq('enabled', true)
      .order('time_slot', { ascending: true });

    if (templateError) {
      throw new Error('Failed to fetch task templates: ' + templateError.message);
    }

    if (templates && templates.length > 0) {
      opsTasks = templates.map(t => ({
        task_kind: t.task_type, // Use task_type as kind
        time_block: getTimeBlock(t.time_slot), // Helper to map time to block
        scheduled_time: t.time_slot,
        priority: t.priority,
        payload: t.rule, // Use the JSON rule as payload
        persona_id: t.persona_id, // Use specific persona if defined in template
        frequency: t.frequency // Capture frequency
      }));
    } else {
      // Fallback to hardcoded if no templates found (optional, or just return empty)
      console.log('No templates found, using fallback logic');
      if (role_type === 'specialist') {
         // ... existing fallback code ...
      }
    }

    // 3. Prepare Insert Data (Loop for 7 days)
    const tasksToInsert: any[] = [];
    const startDate = new Date(date);
    const personaToAccountMap = new Map<string, string>();
    
    if (assignments) {
      assignments.forEach(a => {
        if (a.persona_id && a.account_id) {
          personaToAccountMap.set(a.persona_id, a.account_id);
        }
      });
    }

    // Loop for 7 days
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const currentDateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay(); // 0 (Sun) - 6 (Sat)

      for (const task of opsTasks) {
        // Check frequency constraints
        let shouldSchedule = false;
        const rule = task.payload || {};
        const frequency = task.frequency || 'daily';
        
        if (frequency === 'daily') {
            shouldSchedule = true;
        } else if (frequency === 'weekday') {
            shouldSchedule = (dayOfWeek >= 1 && dayOfWeek <= 5);
        } else if (frequency === 'weekend') {
            shouldSchedule = (dayOfWeek === 0 || dayOfWeek === 6);
        } else if (frequency === 'weekly') {
             // Legacy weekly (maybe specific day or just one day? Assuming Monday for now if no rule)
             // Or check rule.weekly_days if present
             if (rule.weekly_days && Array.isArray(rule.weekly_days)) {
                 shouldSchedule = rule.weekly_days.includes(dayOfWeek);
             } else {
                 shouldSchedule = (dayOfWeek === 1); // Default to Monday
             }
        } else if (frequency === 'weekly_custom') {
             if (rule.weekly_days && Array.isArray(rule.weekly_days)) {
                 shouldSchedule = rule.weekly_days.includes(dayOfWeek);
             }
        }

        if (!shouldSchedule) continue;

        if (task.persona_id) {
            // Case A: Specific Persona
            if (personaIds.includes(task.persona_id)) {
                const targetAccountId = personaToAccountMap.get(task.persona_id) || primaryAccountId;
                tasksToInsert.push({
                    staff_id,
                    account_id: targetAccountId,
                    persona_id: task.persona_id,
                    task_date: currentDateStr,
                    task_kind: task.task_kind,
                    task_type: task.task_kind,
                    time_block: task.time_block,
                    priority: task.priority,
                    payload: task.payload,
                    scheduled_time: task.scheduled_time,
                    status: 'pending_publish',
                    content_text: null,
                    platform: 'instagram'
                });
            }
        } else {
            // Case B: General Template
            for (const pid of personaIds) {
                const targetAccountId = personaToAccountMap.get(pid) || primaryAccountId;
                tasksToInsert.push({
                    staff_id,
                    account_id: targetAccountId,
                    persona_id: pid,
                    task_date: currentDateStr,
                    task_kind: task.task_kind,
                    task_type: task.task_kind,
                    time_block: task.time_block,
                    priority: task.priority,
                    payload: task.payload,
                    scheduled_time: task.scheduled_time,
                    status: 'pending_publish',
                    content_text: null,
                    platform: 'instagram'
                });
            }
            if (personaIds.length === 0 && finalPersonaId) {
                tasksToInsert.push({
                    staff_id,
                    account_id: primaryAccountId,
                    persona_id: finalPersonaId,
                    task_date: currentDateStr,
                    task_kind: task.task_kind,
                    task_type: task.task_kind,
                    time_block: task.time_block,
                    priority: task.priority,
                    payload: task.payload,
                    scheduled_time: task.scheduled_time,
                    status: 'pending_publish',
                    content_text: null,
                    platform: 'instagram'
                });
            }
        }
      }
    }

    // Delete existing tasks for this date range/staff to avoid duplicates
    // We delete tasks from startDate to startDate + 6 days
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const endDateStr = endDate.toISOString().split('T')[0];
    
    await supabase.from('work_tasks')
      .delete()
      .eq('staff_id', staff_id)
      .gte('task_date', date) // startDate string
      .lte('task_date', endDateStr);

    // 4. Insert into DB
    if (tasksToInsert.length > 0) {
      const { data, error } = await supabase
        .from('work_tasks')
        .insert(tasksToInsert)
        .select();

      if (error) {
        console.error('Error creating daily tasks:', error);
        res.status(500).json({ error: error.message });
        return;
      }
      
      // Add debug log to see what's returned
      console.log('Inserted tasks:', data);

      res.status(200).json({
        success: true,
        message: `Daily runbook generated from ${tasksToInsert.length} templates`,
        data: data
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'No templates active, no tasks generated',
        data: []
      });
    }

  } catch (error: any) {
    console.error('Generate Daily Runbook Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Helper function to map time to blocks
function getTimeBlock(time: string): string {
  const hour = parseInt(time.split(':')[0]);
  if (hour < 12) return 'morning_routine';
  if (hour < 15) return 'wake_up';
  if (hour < 17) return 'warm_up';
  if (hour < 20) return 'production';
  if (hour < 22) return 'war';
  return 'closing';
}

export default router;
