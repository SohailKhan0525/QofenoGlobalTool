import { readFileSync, existsSync } from 'fs';

if (existsSync('./test-results/heavy-544-report.json')) {
  const report = JSON.parse(readFileSync('./test-results/heavy-544-report.json', 'utf8'));
  console.log('FAILURES:', JSON.stringify(report.failures, null, 2));
} else {
  console.log('No report file yet.');
}
