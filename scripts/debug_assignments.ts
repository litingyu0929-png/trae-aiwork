import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkAssignments() {
  console.log('Checking assignments...');

  // 1. Get all profiles to see who is available
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('id, full_name, role');
  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }
  console.log('Profiles:', profiles);

  // 2. Get all accounts to see assignments
  const { data: accounts, error: accountError } = await supabase.from('accounts').select('id, account_name, assigned_to, onboarding_status');
  if (accountError) {
    console.error('Error fetching accounts:', accountError);
    return;
  }
  console.log('Accounts:', accounts);

  // 3. Check for specific staff assignment if simulated
  // You can manually set ID here if you know it from previous context, otherwise we look at all
}

checkAssignments();
