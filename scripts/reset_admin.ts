
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

async function resetAdminPassword() {
    console.log('--- Resetting Admin Password ---');
    const email = 'admin@lego999.com';
    const newPassword = 'lego999';

    // 1. Check if user exists
    console.log(`Checking for user: ${email}...`);
    // Note: We can't directly query auth.users with select easily via client unless we use specific admin api
    // But listUsers is available in admin api
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
        console.error('List Users Error:', listError);
        return;
    }

    const adminUser = users.find(u => u.email === email);

    if (adminUser) {
        console.log(`Found user ${email} (ID: ${adminUser.id}). Updating password...`);
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            adminUser.id,
            { password: newPassword }
        );

        if (updateError) {
            console.error('Password Update Failed:', updateError.message);
        } else {
            console.log('Password updated successfully!');
        }

        // Ensure profile exists and role is admin
        console.log('Updating profile...');
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: adminUser.id,
                email: email,
                full_name: 'System Admin',
                role: 'admin'
            });
        
        if (profileError) {
            console.error('Profile Update Failed:', profileError.message);
        } else {
            console.log('Profile updated successfully!');
        }

    } else {
        console.log(`User ${email} not found. Creating new admin user...`);
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: email,
            password: newPassword,
            email_confirm: true,
            user_metadata: { full_name: 'System Admin' }
        });

        if (createError) {
            console.error('Create User Failed:', createError.message);
            return;
        }

        console.log(`User created (ID: ${newUser.user.id}). Creating profile...`);
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: newUser.user.id,
                email: email,
                full_name: 'System Admin',
                role: 'admin'
            });

        if (profileError) {
            console.error('Profile Creation Failed:', profileError.message);
        } else {
            console.log('Profile created successfully!');
        }
    }
}

resetAdminPassword();
