
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAccounts() {
  console.log('Checking accounts schema...');
  // Insert a dummy row to see if it fails, or check one row
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching accounts:', error);
  } else if (accounts && accounts.length > 0) {
    console.log('Account columns:', Object.keys(accounts[0]));
  } else {
    console.log('No accounts found. Attempting to insert a test account to check schema...');
    // We can't easily check schema without admin API or inspection
    // But we can try to inspect the error from a failed insert if we miss columns
  }
}

checkAccounts();
