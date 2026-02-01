
import axios from 'axios';
import fs from 'fs';

const BASE_URL = 'http://localhost:3001/api';
const CONCURRENT_REQUESTS = 20;
const TOTAL_REQUESTS = 100;

async function runLoadTest() {
  console.log(`🔥 Starting Load Test (${TOTAL_REQUESTS} requests, ${CONCURRENT_REQUESTS} concurrent)...\n`);
  
  const report: string[] = [];
  report.push('# Performance Load Test Report');
  report.push(`Target: ${BASE_URL}/personas`);
  report.push(`Concurrency: ${CONCURRENT_REQUESTS}`);
  report.push('');

  let completed = 0;
  let success = 0;
  let failed = 0;
  const times: number[] = [];

  const startTotal = Date.now();

  const makeRequest = async () => {
    const start = Date.now();
    try {
      await axios.get(`${BASE_URL}/personas`);
      success++;
    } catch (e) {
      failed++;
    } finally {
      const duration = Date.now() - start;
      times.push(duration);
      completed++;
      process.stdout.write(`\rProgress: ${completed}/${TOTAL_REQUESTS}`);
    }
  };

  const batchSize = CONCURRENT_REQUESTS;
  for (let i = 0; i < TOTAL_REQUESTS; i += batchSize) {
    const batch = [];
    for (let j = 0; j < batchSize && (i + j) < TOTAL_REQUESTS; j++) {
      batch.push(makeRequest());
    }
    await Promise.all(batch);
  }

  const totalTime = Date.now() - startTotal;
  console.log('\n\n✅ Load Test Completed');

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);
  const rps = (TOTAL_REQUESTS / (totalTime / 1000)).toFixed(2);

  console.log(`
  Results:
  - Total Time: ${totalTime}ms
  - Success: ${success}
  - Failed: ${failed}
  - RPS: ${rps} req/sec
  - Avg Latency: ${avgTime.toFixed(2)}ms
  - Max Latency: ${maxTime}ms
  `);

  report.push(`- **Total Requests**: ${TOTAL_REQUESTS}`);
  report.push(`- **Success Rate**: ${((success / TOTAL_REQUESTS) * 100).toFixed(1)}%`);
  report.push(`- **RPS**: ${rps}`);
  report.push(`- **Avg Latency**: ${avgTime.toFixed(2)}ms`);
  report.push(`- **Max Latency**: ${maxTime}ms`);
  
  if (avgTime > 2000) {
      report.push(`\n❌ **Performance Warning**: Avg latency > 2s`);
  } else {
      report.push(`\n✅ **Performance Pass**: Avg latency < 2s`);
  }

  fs.writeFileSync('load_test_report.md', report.join('\n'));
}

runLoadTest();
