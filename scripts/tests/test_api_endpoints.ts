
import axios from 'axios';
import fs from 'fs';

const BASE_URL = 'http://localhost:3001/api';

async function runApiTests() {
  console.log('🔍 Starting API Functional Tests...\n');
  const report: string[] = [];
  report.push('# API Functional Test Report');
  report.push(`Date: ${new Date().toISOString()}`);
  report.push('');

  const endpoints = [
    { method: 'GET', url: '/personas', name: 'List Personas' },
    { method: 'GET', url: '/assets', name: 'List Assets' },
    { method: 'GET', url: '/system_logs', name: 'System Logs' },
    { method: 'GET', url: '/health', name: 'Health Check' }, // Assuming exists
  ];

  for (const ep of endpoints) {
    try {
      const start = Date.now();
      // @ts-ignore
      const res = await axios({
        method: ep.method,
        url: `${BASE_URL}${ep.url}`,
        validateStatus: () => true // Don't throw on error status
      });
      const duration = Date.now() - start;

      const statusIcon = res.status >= 200 && res.status < 300 ? '✅' : '❌';
      console.log(`${statusIcon} ${ep.method} ${ep.url} - ${res.status} (${duration}ms)`);
      
      report.push(`- [${res.status >= 200 && res.status < 300 ? 'x' : ' '}] **${ep.name}** (${ep.method} ${ep.url})`);
      report.push(`  - Status: ${res.status}`);
      report.push(`  - Time: ${duration}ms`);
      
      if (res.status >= 400) {
          report.push(`  - Error: ${JSON.stringify(res.data)}`);
      }

    } catch (e: any) {
      console.error(`❌ ${ep.method} ${ep.url} - Network Error:`, e.message);
      report.push(`- [ ] **${ep.name}**: ❌ Network Error (${e.message})`);
    }
  }

  // Test Error Handling (404)
  try {
      const res = await axios.get(`${BASE_URL}/non-existent-route`, { validateStatus: () => true });
      if (res.status === 404) {
          console.log('✅ 404 Handling verified');
          report.push(`- [x] **Error Handling**: ✅ 404 Verified`);
      } else {
          console.warn('⚠️ 404 Handling mismatch:', res.status);
          report.push(`- [ ] **Error Handling**: ⚠️ Expected 404, got ${res.status}`);
      }
  } catch (e) {}

  fs.writeFileSync('api_test_report.md', report.join('\n'));
  console.log('\n📝 Report saved to api_test_report.md');
}

runApiTests();
