
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDebug() {
    console.log('--- Debugging Supabase ---');

    // 1. Check Profiles and Roles
    console.log('\n1. Checking Profiles (Admins/Leaders)...');
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role, full_name');
    
    if (profileError) {
        console.error('Error fetching profiles:', profileError.message);
    } else {
        console.table(profiles);
        const admins = profiles?.filter(p => ['admin', 'team_leader', 'manager'].includes(p.role));
        console.log(`Found ${admins?.length} admins/leaders.`);
    }

    // 2. Check Notifications Table
    console.log('\n2. Checking Notifications Table...');
    const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (notifError) {
        console.error('Error fetching notifications:', notifError.message);
        if (notifError.code === '42P01') {
            console.error('TABLE notifications DOES NOT EXIST!');
        }
    } else {
        console.log(`Found ${notifications?.length} notifications.`);
        console.table(notifications);
    }

    // 3. Test Notification Insert
    console.log('\n3. Testing Notification Insert...');
    if (profiles && profiles.length > 0) {
        const targetUser = profiles[0];
        console.log(`Attempting to insert notification for ${targetUser.email} (${targetUser.id})...`);
        
        const { data: insertData, error: insertError } = await supabase
            .from('notifications')
            .insert({
                recipient_id: targetUser.id,
                type: 'system_test',
                title: 'Debug Test',
                content: { message: 'This is a test from debug script' },
                status: 'unread'
            })
            .select();
        
        if (insertError) {
            console.error('Insert Failed:', insertError.message);
        } else {
            console.log('Insert Success:', insertData);
        }
    }
}

runDebug();
