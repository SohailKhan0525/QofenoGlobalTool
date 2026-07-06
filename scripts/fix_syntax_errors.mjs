import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TOOLS_DIR = path.join(ROOT, 'appwrite-functions', 'tools');
const ROOT_FUNCS_DIR = path.join(ROOT, 'appwrite-functions');

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  
  const cleanParseBody = `function parseBody(req) {
  if (req.bodyRaw && typeof req.bodyRaw === 'string') {
    try { return JSON.parse(req.bodyRaw); } catch { /* ignore */ }
  }
  if (req.body && typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { /* ignore */ }
  }
  if (typeof req.body === 'object' && req.body !== null) {
    return req.body;
  }
  return {};
}

`;

  // Matches function parseBody(req) { ... } and any trailing braces or spaces up to the next declaration
  const regex = /function parseBody\s*\(\s*req\s*\)\s*\{[\s\S]*?(?=function\s+\w+|async\s+function\s+\w+|export\s+default)/;
  
  if (regex.test(content)) {
    content = content.replace(regex, cleanParseBody);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed parseBody in: ${path.relative(ROOT, filePath)}`);
  } else {
    // If it doesn't match the structure, let's check if it has a custom parseBody and output a warning
    if (content.includes('function parseBody')) {
      console.warn(`WARNING: Found parseBody but regex did not match in: ${path.relative(ROOT, filePath)}`);
    }
  }
}

// Fix all tools
const dirs = fs.readdirSync(TOOLS_DIR).filter(f => fs.statSync(path.join(TOOLS_DIR, f)).isDirectory());
dirs.forEach(slug => {
  fixFile(path.join(TOOLS_DIR, slug, 'src', 'main.js'));
});

// Fix root functions and platform functions
const rootFuncs = fs.readdirSync(ROOT_FUNCS_DIR).filter(f => f !== 'tools' && fs.statSync(path.join(ROOT_FUNCS_DIR, f)).isDirectory());
rootFuncs.forEach(folder => {
  // If it's platform folder, search inside it
  if (folder === 'platform') {
    const platformDir = path.join(ROOT_FUNCS_DIR, 'platform');
    const pFuncs = fs.readdirSync(platformDir).filter(f => fs.statSync(path.join(platformDir, f)).isDirectory());
    pFuncs.forEach(p => {
      fixFile(path.join(platformDir, p, 'src', 'main.js'));
    });
  } else {
    fixFile(path.join(ROOT_FUNCS_DIR, folder, 'src', 'main.js'));
  }
});

console.log("Done fixing parseBody functions!");
