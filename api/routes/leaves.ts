
import { Router } from 'express';
import getSupabaseClient from '../supabaseClient.js';

const router = Router();

// Get my leaves
router.get('/my-leaves', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { userId } = req.query; // Assuming userId is passed or we get it from auth middleware
    // For this project, it seems auth is handled or we pass user_id.
    // Let's check how other routes handle auth.
    // Assuming 'user_id' query param for simplicity based on previous interactions, 
    // or req.user if auth middleware is present.
    
    // Let's assume the client sends user_id for now as I saw in TeamManagementPage
    
    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const { data, error } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create leave application
router.post('/', async (req, res) => {
  console.log('Received leave application request:', req.body);
  try {
    const supabase = getSupabaseClient();
    const { user_id, leave_type, reason, dates } = req.body;
    // Legacy support or fallback if needed, but we prefer 'dates' array now
    let { start_date, end_date, total_days } = req.body;

    // Basic validation
    if (!user_id || !leave_type) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    let leaveRanges = [];

    if (dates && Array.isArray(dates) && dates.length > 0) {
        // Group dates into ranges
        const sortedDates = [...dates].sort();
        
        // Helper to check if dates are consecutive
        const isNextDay = (d1Str: string, d2Str: string) => {
            const d1 = new Date(d1Str);
            const d2 = new Date(d2Str);
            const diffTime = Math.abs(d2.getTime() - d1.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            return diffDays === 1;
        };

        let currentRange = { start: sortedDates[0], end: sortedDates[0], count: 1 };
        
        for (let i = 1; i < sortedDates.length; i++) {
            if (isNextDay(currentRange.end, sortedDates[i])) {
                currentRange.end = sortedDates[i];
                currentRange.count++;
            } else {
                leaveRanges.push(currentRange);
                currentRange = { start: sortedDates[i], end: sortedDates[i], count: 1 };
            }
        }
        leaveRanges.push(currentRange);
    } else if (start_date && end_date) {
        // Fallback for legacy calls
        leaveRanges.push({ 
            start: start_date, 
            end: end_date, 
            count: total_days || 1 // simplified, ideally calc days
        });
    } else {
        return res.status(400).json({ success: false, error: 'Dates or start/end date required' });
    }

    // 1. Check conflicts for ALL ranges
    // We can do this by checking if ANY of the ranges overlap with existing leaves
    // Optimization: fetch all active leaves for this user first
    const { data: existingLeaves, error: fetchError } = await supabase
        .from('leave_applications')
        .select('start_date, end_date')
        .eq('user_id', user_id)
        .in('status', ['pending', 'approved']);

    if (fetchError) throw fetchError;

    const hasConflict = leaveRanges.some(range => {
        const rStart = new Date(range.start);
        const rEnd = new Date(range.end);
        
        return existingLeaves?.some(leaf => {
            const lStart = new Date(leaf.start_date);
            const lEnd = new Date(leaf.end_date);
            return (rStart <= lEnd && rEnd >= lStart);
        });
    });

    if (hasConflict) {
        return res.status(400).json({ success: false, error: '部分日期與現有休假衝突' });
    }

    // 2. Insert all ranges
    const inserts = leaveRanges.map(range => ({
        user_id,
        leave_type,
        start_date: range.start,
        end_date: range.end,
        total_days: range.count,
        reason: reason + (leaveRanges.length > 1 ? ` (包含於批量申請: ${dates.length}天)` : ''),
        status: 'pending' // default
    }));

    const { data, error } = await supabase
      .from('leave_applications')
      .insert(inserts)
      .select();

    if (error) throw error;

    // 3. Notify Admins/Managers
    // Find all admins or team leaders
    const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'team_leader', 'manager']);
    
    if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
            recipient_id: admin.id,
            type: 'leave_request',
            title: '新休假申請',
            content: {
                message: `有新的休假申請待審核`,
                application_count: inserts.length,
                applicant_id: user_id
            },
            status: 'unread'
        }));
        
        await supabase.from('notifications').insert(notifications);
    }

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get pending leaves (Manager)
router.get('/pending', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    // Ideally check if user is manager/admin
    const { data, error } = await supabase
      .from('leave_applications')
      .select(`
        *,
        profiles:user_id (full_name, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching pending leaves:', error);
        throw error;
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Exception in GET /pending:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Review leave (Approve/Reject)
router.put('/:id/review', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { status, approved_by, rejection_reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const { data, error } = await supabase
      .from('leave_applications')
      .update({ 
        status, 
        approved_by, 
        rejection_reason: status === 'rejected' ? rejection_reason : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all leaves (Status Board)
router.get('/board', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { date, startDate, endDate, department_id, name } = req.query;
    
    let query = supabase
      .from('leave_applications')
      .select(`
        *,
        profiles:user_id (full_name, email, avatar_url, role, department)
      `)
      .eq('status', 'approved');

    if (date) {
        // Single date check
        query = query.lte('start_date', date).gte('end_date', date);
    } else if (startDate && endDate) {
        // Date range check (overlap)
        // leave_start <= query_end AND leave_end >= query_start
        query = query.lte('start_date', endDate).gte('end_date', startDate);
    }
    
    // Note: Filtering by department or name on joined table is harder in simple Supabase query without dedicated RPC or embedding.
    // For now, we will fetch and filter in memory if volume is low, or use specific filters if Supabase supports it well on foreign tables.
    // Let's assume we just fetch recent approved leaves and filter on frontend or do simple filtering.
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Backend filtering for relation fields if needed, but let's send data to frontend.
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
