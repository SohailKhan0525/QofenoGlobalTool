import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolsDir = path.join(__dirname, '..', 'appwrite-functions', 'tools');
const tools = fs.readdirSync(toolsDir).filter(d => fs.statSync(path.join(toolsDir, d)).isDirectory());

let fixed = 0;
let needsFix = 0;
let skipped = 0;
let alreadyFixed = 0;

for (const tool of tools) {
  const mainFile = path.join(toolsDir, tool, 'src', 'main.js');
  if (!fs.existsSync(mainFile)) { skipped++; continue; }
  
  const content = fs.readFileSync(mainFile, 'utf8');
  
  // Check if already has proper data URL handling
  if (content.includes('decodeFileInput') || content.includes('data:[^;]+;base64') || content.includes(';base64,')) {
    alreadyFixed++;
    console.log('ALREADY_FIXED:', tool);
    continue;
  }
  
  // Check if has the broken pattern - uses Buffer.from with base64 but no stripping
  if (content.includes("Buffer.from(b.file_base64, 'base64')")) {
    console.log('NEEDS_FIX:', tool);
    needsFix++;
  } else if (content.includes('file_base64')) {
    console.log('HAS_FILE_BASE64_OTHER_PATTERN:', tool);
    fixed++;
  } else {
    console.log('NO_FILE_BASE64:', tool);
    skipped++;
  }
}

console.log('\nSummary:');
console.log('Already fixed (has data URL handling):', alreadyFixed);
console.log('Needs fix (broken Buffer.from pattern):', needsFix);
console.log('Other file_base64 pattern:', fixed);
console.log('No file_base64 / no main.js:', skipped);
