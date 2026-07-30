const fs = require('fs');
const path = require('path');

const funcs = [
  'qofeno-pdf',
  'qofeno-image',
  'qofeno-video',
  'qofeno-audio',
  'qofeno-text',
  'qofeno-developer',
  'qofeno-data',
  'qofeno-security'
];

for (const f of funcs) {
  const pJsonPath = path.join('functions', f, 'package.json');
  console.log(`=== ${f} ===`);
  if (fs.existsSync(pJsonPath)) {
    const content = JSON.parse(fs.readFileSync(pJsonPath, 'utf-8'));
    console.log('Dependencies:', Object.keys(content.dependencies || {}).join(', '));
  } else {
    console.log('No package.json found');
  }
}
