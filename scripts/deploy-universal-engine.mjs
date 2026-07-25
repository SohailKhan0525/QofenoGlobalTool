// scripts/deploy-universal-engine.mjs
// Writes the fixed main.js (with category field fix + real-time progress logs) to all 8 functions
import fs from 'fs';
import path from 'path';

const functions = [
  'qofeno-pdf', 'qofeno-image', 'qofeno-video', 'qofeno-audio',
  'qofeno-text', 'qofeno-developer', 'qofeno-data', 'qofeno-security'
];

const mainJsContent = fs.readFileSync(
  path.join(process.cwd(), 'scripts', 'shared-main-template.js'),
  'utf-8'
);

for (const fn of functions) {
  const mainPath = path.join(process.cwd(), 'functions', fn, 'src', 'main.js');
  fs.writeFileSync(mainPath, mainJsContent);
  console.log(`✅ Updated ${fn}/src/main.js`);
}

console.log('\nAll 8 function main.js entrypoints updated with:');
console.log('  - category field fix (required attribute was missing)');
console.log('  - saveExecutionLog() for real-time progress tracking');
console.log('  - improved universalFallback with all common tools');
