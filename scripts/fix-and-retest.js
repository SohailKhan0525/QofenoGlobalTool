import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { Client, Functions, Storage, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

const REPORT_PATH = './test-results/heavy-544-report.json';

async function fixAndRetest() {
  console.log('\n🔧 QOFENO — AUTOMATED TOOL REPAIR & RETEST ENGINE\n');

  if (!existsSync(REPORT_PATH)) {
    console.error('Report file test-results/heavy-544-report.json not found! Run test-all-544-tools-heavy.js first.');
    process.exit(1);
  }

  const report = JSON.parse(readFileSync(REPORT_PATH, 'utf8'));
  console.log(`Loaded test report (${report.summary.passed} Passed / ${report.summary.failed} Failed)`);

  if (report.failures.length === 0) {
    console.log('🎉 100% PASS RATE ACHIEVED! No failures to repair.');
    process.exit(0);
  }

  console.log(`\nAnalyzing ${report.failures.length} failing tools...\n`);

  // Log breakdown of failure reasons
  const reasonMap = {};
  report.failures.forEach(f => {
    const r1 = f.run1?.reason || f.run1?.status || 'Unknown';
    const r2 = f.run2?.reason || f.run2?.status || 'Unknown';
    const key = `${r1} || ${r2}`;
    reasonMap[key] = (reasonMap[key] || 0) + 1;
  });

  console.log('Failure Reason Breakdown:');
  Object.entries(reasonMap).forEach(([reason, count]) => {
    console.log(`  - [${count}] ${reason}`);
  });

  console.log('\nDeploying updated functions...');
  execSync('node scripts/deploy_grouped_functions.mjs', { stdio: 'inherit' });

  console.log('\nRe-testing failed tools...');
  execSync('node scripts/test-all-544-tools-heavy.js', { stdio: 'inherit' });
}

fixAndRetest().catch(console.error);
