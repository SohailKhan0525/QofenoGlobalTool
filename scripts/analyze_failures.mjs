import { readFileSync } from 'fs';

const report = JSON.parse(readFileSync('./test-results/heavy-544-report.json', 'utf8'));

console.log('SUMMARY:', report.summary);
console.log('FAILURES COUNT:', report.failures.length);

const failureCategories = {};
const failureReasons = {};

report.failures.forEach(f => {
  failureCategories[f.category] = (failureCategories[f.category] || 0) + 1;
  const r1 = f.run1?.reason || f.run1?.status || 'Unknown';
  const r2 = f.run2?.reason || f.run2?.status || 'Unknown';
  const key = `R1: ${r1} | R2: ${r2}`;
  failureReasons[key] = (failureReasons[key] || 0) + 1;
});

console.log('\n--- FAILURES BY CATEGORY ---');
console.table(failureCategories);

console.log('\n--- FAILURES BY EXACT REASON ---');
console.table(failureReasons);

console.log('\n--- SAMPLE 10 FAILURES ---');
console.log(JSON.stringify(report.failures.slice(0, 10), null, 2));
