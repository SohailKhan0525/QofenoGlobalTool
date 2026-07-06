/**
 * fix_base64_parsing.mjs
 * Patches all 43 tool functions that have the broken Buffer.from(b.file_base64, 'base64')
 * pattern by replacing readInputBuffer with a version that strips data URL prefixes.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolsDir = path.join(__dirname, '..', 'appwrite-functions', 'tools');
const tools = fs.readdirSync(toolsDir).filter(d => fs.statSync(path.join(toolsDir, d)).isDirectory());

// The broken pattern to match
const BROKEN_READ_INPUT = `  async function readInputBuffer(b) {
    let buf;
    let mimeType = 'application/octet-stream';
    if (b.file_base64) {
      buf = Buffer.from(b.file_base64, 'base64');
      mimeType = b.mime_type || mimeType;
    } else if (b.file_url) {
      const response = await fetch(b.file_url);
      if (!response.ok) throw new Error('Failed to fetch file from URL');
      const arrayBuffer = await response.arrayBuffer();
      buf = Buffer.from(arrayBuffer);
      mimeType = response.headers.get('content-type') || mimeType;
    } else if (b.file_id) {
      const arrayBuffer = await storage.getFileDownload(process.env.BUCKET_INPUTS, b.file_id);
      buf = Buffer.from(arrayBuffer);
    } else {
      throw new Error('No file provided');
    }
    return { buffer: buf, mimeType };
  }`;

// Alternative broken pattern (audio tools use different default mimeType)
const BROKEN_READ_INPUT_AUDIO = `  async function readInputBuffer(b) {
    let buf;
    let mimeType = 'audio/mpeg';
    if (b.file_base64) {
      buf = Buffer.from(b.file_base64, 'base64');
      mimeType = b.mime_type || mimeType;
    } else if (b.file_url) {
      const response = await fetch(b.file_url);
      if (!response.ok) throw new Error('Failed to fetch file from URL');
      const arrayBuffer = await response.arrayBuffer();
      buf = Buffer.from(arrayBuffer);
      mimeType = response.headers.get('content-type') || mimeType;
    } else if (b.file_id) {
      const arrayBuffer = await storage.getFileDownload(process.env.BUCKET_INPUTS, b.file_id);
      buf = Buffer.from(arrayBuffer);
    } else {
      throw new Error('No file_base64, file_url, or file_id provided');
    }
    return { buffer: buf, mimeType };
  }`;

// Fixed version that properly strips data URL prefix
const FIXED_READ_INPUT = `  function decodeBase64Input(value) {
    if (!value || typeof value !== 'string') return value;
    // Strip data URL prefix: "data:image/jpeg;base64,/9j/..." => "/9j/..."
    const match = value.match(/^data:[^;]+;base64,(.+)$/i);
    return match ? match[1] : value;
  }

  async function readInputBuffer(b) {
    let buf;
    let mimeType = 'application/octet-stream';
    if (b.file_base64) {
      const raw = decodeBase64Input(b.file_base64);
      buf = Buffer.from(raw, 'base64');
      mimeType = b.mime_type || mimeType;
    } else if (b.file_url) {
      const response = await fetch(b.file_url);
      if (!response.ok) throw new Error('Failed to fetch file from URL');
      const arrayBuffer = await response.arrayBuffer();
      buf = Buffer.from(arrayBuffer);
      mimeType = response.headers.get('content-type') || mimeType;
    } else if (b.file_id) {
      const arrayBuffer = await storage.getFileDownload(process.env.BUCKET_INPUTS, b.file_id);
      buf = Buffer.from(arrayBuffer);
    } else {
      throw new Error('No file provided. Send file_base64, file_url, or file_id.');
    }
    return { buffer: buf, mimeType };
  }`;

let patchedCount = 0;
let skippedCount = 0;
let notFoundCount = 0;

for (const tool of tools) {
  const mainFile = path.join(toolsDir, tool, 'src', 'main.js');
  if (!fs.existsSync(mainFile)) {
    skippedCount++;
    continue;
  }
  
  let content = fs.readFileSync(mainFile, 'utf8');
  
  // Skip already-fixed files
  if (content.includes('decodeBase64Input') || content.includes('decodeFileInput') || 
      content.includes(';base64,') || !content.includes("Buffer.from(b.file_base64, 'base64')")) {
    console.log('SKIP:', tool, '(already fixed or no broken pattern)');
    skippedCount++;
    continue;
  }
  
  // Try to replace the broken pattern
  let newContent = content;
  
  if (content.includes(BROKEN_READ_INPUT_AUDIO)) {
    newContent = content.replace(BROKEN_READ_INPUT_AUDIO, FIXED_READ_INPUT);
    console.log('PATCHED (audio pattern):', tool);
  } else if (content.includes(BROKEN_READ_INPUT)) {
    newContent = content.replace(BROKEN_READ_INPUT, FIXED_READ_INPUT);
    console.log('PATCHED (default pattern):', tool);
  } else {
    // Fallback: manual patch using simpler string replacement
    const simplePattern = "      buf = Buffer.from(b.file_base64, 'base64');";
    if (content.includes(simplePattern)) {
      const helperFn = `
  function decodeBase64Input(value) {
    if (!value || typeof value !== 'string') return value;
    const match = value.match(/^data:[^;]+;base64,(.+)$/i);
    return match ? match[1] : value;
  }

`;
      // Insert helper before the function
      const insertBefore = '  async function readInputBuffer(b) {';
      newContent = content.replace(insertBefore, helperFn + insertBefore);
      // Replace the broken parse line
      newContent = newContent.replace(simplePattern, 
        "      const raw = decodeBase64Input(b.file_base64);\n      buf = Buffer.from(raw, 'base64');");
      console.log('PATCHED (simple pattern):', tool);
    } else {
      console.log('NOT_FOUND pattern in:', tool);
      notFoundCount++;
      continue;
    }
  }
  
  if (newContent !== content) {
    fs.writeFileSync(mainFile, newContent, 'utf8');
    patchedCount++;
  }
}

console.log('\n=== PATCH SUMMARY ===');
console.log('Patched:', patchedCount);
console.log('Skipped (already fixed):', skippedCount);
console.log('Not found (manual check needed):', notFoundCount);
