
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDbTests() {
  console.log('🔍 Starting Database Integrity Tests...\n');
  const report: string[] = [];
  report.push('# Database Integrity Test Report');
  report.push(`Date: ${new Date().toISOString()}`);
  report.push('');

  // 1. Check Table Existence & Structure (by simple SELECT)
  const tables = ['profiles', 'accounts', 'assets', 'contents', 'personas', 'system_logs'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.error(`❌ Table '${table}' check failed:`, error.message);
        report.push(`- [ ] Table **${table}**: ❌ Failed (${error.message})`);
      } else {
        console.log(`✅ Table '${table}' exists and is accessible.`);
        report.push(`- [x] Table **${table}**: ✅ OK`);
      }
    } catch (e: any) {
      console.error(`❌ Table '${table}' exception:`, e.message);
      report.push(`- [ ] Table **${table}**: ❌ Exception (${e.message})`);
    }
  }

  // 2. CRUD Verification (Using 'system_logs' as it's safe)
  console.log('\nTesting CRUD on system_logs...');
  const testLogId = `test-${Date.now()}`;
  
  // Create
  const { error: insertError } = await supabase.from('system_logs').insert({
    level: 'info',
    message: 'DB Integrity Test',
    meta: { test_id: testLogId }
  });
  
  if (insertError) {
    console.error('❌ Insert failed:', insertError.message);
    report.push(`- [ ] CRUD Insert: ❌ Failed (${insertError.message})`);
  } else {
    console.log('✅ Insert successful');
    report.push(`- [x] CRUD Insert: ✅ OK`);
  }

  // Read
  const { data: readData, error: readError } = await supabase
    .from('system_logs')
    .select('*')
    .eq('message', 'DB Integrity Test')
    .limit(1);

  if (readError || !readData || readData.length === 0) {
    console.error('❌ Read failed:', readError?.message || 'No data found');
    report.push(`- [ ] CRUD Read: ❌ Failed`);
  } else {
    console.log('✅ Read successful');
    report.push(`- [x] CRUD Read: ✅ OK`);
  }

  // Delete (Cleanup)
  // Note: We might want to keep it for log, but let's delete to prove we can.
  // Actually system_logs might strictly be append-only in some designs, but let's try.
  if (readData && readData.length > 0) {
      const { error: deleteError } = await supabase
        .from('system_logs')
        .delete()
        .match({ id: readData[0].id });
        
      if (deleteError) {
          console.warn('⚠️ Delete failed (might be expected for logs):', deleteError.message);
          report.push(`- [ ] CRUD Delete: ⚠️ Failed (${deleteError.message})`);
      } else {
          console.log('✅ Delete successful');
          report.push(`- [x] CRUD Delete: ✅ OK`);
      }
  }

  // 3. Foreign Key Constraint Check (Attempt to insert asset with invalid profile_id)
  console.log('\nTesting FK Constraints...');
  const { error: fkError } = await supabase.from('assets').insert({
    type: 'image',
    source_platform: 'test',
    adopted_by: '00000000-0000-0000-0000-000000000000' // Invalid UUID
  });

  if (fkError) {
    console.log('✅ FK Constraint worked (Insert failed as expected):', fkError.message);
    report.push(`- [x] FK Constraint: ✅ Verified (Blocked invalid insert)`);
  } else {
    console.error('❌ FK Constraint FAILED (Invalid insert succeeded)');
    report.push(`- [ ] FK Constraint: ❌ Failed (Invalid data accepted)`);
  }

  // Save Report
  fs.writeFileSync('db_test_report.md', report.join('\n'));
  console.log('\n📝 Report saved to db_test_report.md');
}

runDbTests();
