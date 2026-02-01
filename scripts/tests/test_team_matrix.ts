
import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

async function testTeamMatrix() {
  console.log('🚀 Starting Team Matrix & Accounts Functional Test...\n');
  let hasError = false;

  try {
    // 1. Test Fetch Team
    console.log('1. Testing GET /api/team...');
    const teamRes = await axios.get(`${BASE_URL}/team`);
    if (teamRes.data.success && Array.isArray(teamRes.data.data)) {
      console.log('✅ GET /api/team passed. Staff count:', teamRes.data.data.length);
    } else {
      console.error('❌ GET /api/team failed:', teamRes.data);
      hasError = true;
    }

    // 2. Test Create Account
    console.log('\n2. Testing POST /api/accounts (Create)...');
    const newAccountPayload = {
      platform: 'instagram',
      account_name: 'Test Auto Account ' + Date.now(),
      account_handle: 'test_auto_' + Date.now(),
      status: 'active',
      login_credentials: { password: 'testpassword123' }
    };
    const createRes = await axios.post(`${BASE_URL}/accounts`, newAccountPayload);
    let createdAccountId = '';
    if (createRes.data.success) {
      createdAccountId = createRes.data.data.id;
      console.log('✅ POST /api/accounts passed. ID:', createdAccountId);
    } else {
      console.error('❌ POST /api/accounts failed:', createRes.data);
      hasError = true;
    }

    // 3. Test Fetch Accounts
    console.log('\n3. Testing GET /api/accounts...');
    const accountsRes = await axios.get(`${BASE_URL}/accounts`);
    if (accountsRes.data.success) {
      const found = accountsRes.data.data.find((a: any) => a.id === createdAccountId);
      if (found) {
        console.log('✅ GET /api/accounts passed. Created account found.');
      } else {
        console.error('❌ GET /api/accounts passed but created account NOT found.');
        hasError = true;
      }
    } else {
      console.error('❌ GET /api/accounts failed:', accountsRes.data);
      hasError = true;
    }

    // 4. Test Update Account
    if (createdAccountId) {
      console.log('\n4. Testing PUT /api/accounts/:id...');
      const updateRes = await axios.put(`${BASE_URL}/accounts/${createdAccountId}`, {
        account_name: 'Updated Name ' + Date.now()
      });
      if (updateRes.data.success && updateRes.data.data.account_name.startsWith('Updated Name')) {
        console.log('✅ PUT /api/accounts passed.');
      } else {
        console.error('❌ PUT /api/accounts failed:', updateRes.data);
        hasError = true;
      }
    }

    // 5. Test Delete Account
    if (createdAccountId) {
      // ... (keep existing delete logic)
      console.log('\n5. Testing DELETE /api/accounts/:id...');
      const deleteRes = await axios.delete(`${BASE_URL}/accounts/${createdAccountId}`);
      if (deleteRes.data.success) {
        console.log('✅ DELETE /api/accounts passed.');
      } else {
        console.error('❌ DELETE /api/accounts failed:', deleteRes.data);
        hasError = true;
      }
    }

    // 6. Test Persona Assignment (Mock)
    console.log('\n6. Testing POST /api/team/assign (Mock)...');
    // Need a valid staff ID and Persona ID.
    // Fetch team and personas first.
    const personasRes = await axios.get(`${BASE_URL}/personas`);
    if (teamRes.data.data.length > 0 && personasRes.data.data.length > 0) {
      const staffId = teamRes.data.data[0].id;
      const personaId = personasRes.data.data[0].id;
      
      const assignRes = await axios.post(`${BASE_URL}/team/assign`, {
        staff_id: staffId,
        persona_ids: [personaId],
        assigned_by: 'test_script'
      });
      
      if (assignRes.data.success) {
        console.log(`✅ POST /api/team/assign passed. Assigned persona ${personaId} to staff ${staffId}`);
      } else {
        console.error('❌ POST /api/team/assign failed:', assignRes.data);
        hasError = true;
      }
    } else {
      console.log('⚠️ Skipping assignment test: No staff or personas found.');
    }

  } catch (error: any) {
    console.error('💥 Critical Test Failure:', error.message);
    if (error.response) {
      console.error('Response Data:', error.response.data);
    }
    hasError = true;
  }

  console.log('\n-----------------------------------');
  console.log(hasError ? '❌ Test Suite Failed' : '✅ Test Suite Completed Successfully');
}

testTeamMatrix();
