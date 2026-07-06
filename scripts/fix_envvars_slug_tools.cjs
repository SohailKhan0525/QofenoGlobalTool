const { Client, Functions } = require('node-appwrite');
require('dotenv').config();

const VARS = {
  APPWRITE_ENDPOINT:    process.env.APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID:  process.env.APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY:     process.env.APPWRITE_API_KEY,
  DATABASE_ID:          process.env.DATABASE_ID || 'qofeno_db',
  BUCKET_INPUTS:        process.env.BUCKET_INPUTS || 'tool_inputs',
  BUCKET_OUTPUTS:       process.env.BUCKET_OUTPUTS || 'tool_outputs',
};

console.log('Env check:');
for (const [k, v] of Object.entries(VARS)) {
  console.log(`  ${k}: ${v ? v.substring(0, 30) : 'MISSING!'}`);
}

if (!VARS.APPWRITE_PROJECT_ID || !VARS.APPWRITE_API_KEY) {
  console.error('FATAL: Missing env vars');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(VARS.APPWRITE_ENDPOINT)
  .setProject(VARS.APPWRITE_PROJECT_ID)
  .setKey(VARS.APPWRITE_API_KEY);

const funcs = new Functions(client);

const SLUG_TOOLS = [
  'aac-converter', 'audio-compressor', 'audio-metadata-viewer', 'audio-reverser',
  'avi-converter', 'background-noise-remover', 'bass-booster', 'blur-image',
  'brightness-adjust', 'change-pitch', 'change-speed', 'contrast-adjust',
  'crop-image', 'extract-audio', 'fade-in', 'fade-out', 'flac-converter',
  'flip-image', 'gif-maker-video', 'merge-audio', 'merge-videos',
  'mov-converter', 'mp3-converter', 'mp4-converter', 'ogg-converter', 'remove-audio',
  'ringtone-maker', 'rotate-image', 'rotate-video', 'sharpen-image', 'silence-remover',
  'speed-changer-video', 'trim-audio', 'volume-booster', 'watermark-image',
  'wav-converter', 'webm-converter',
  // PDF slug functions that actually exist
  'batch-compress-pdfs', 'batch-convert-pdfs', 'batch-merge-pdfs',
  'pdf-booklet-creator', 'pdf-color-converter', 'pdf-delete-pages',
  'pdf-extract-pages', 'pdf-flatten',
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function setVarsForFn(fnId) {
  try {
    // Get existing variables
    const existing = await funcs.listVariables({ functionId: fnId });
    const existingMap = {};
    for (const v of existing.variables) {
      existingMap[v.key] = v['$id'];
    }
    
    for (const [key, value] of Object.entries(VARS)) {
      if (!value) continue;
      if (existingMap[key]) {
        // Update existing variable
        await funcs.updateVariable({
          functionId: fnId,
          variableId: existingMap[key],
          key: key,
          value: value,
        });
      } else {
        // Create new variable using object form (new SDK API)
        await funcs.createVariable({
          functionId: fnId,
          key: key,
          value: value,
        });
      }
      await sleep(100);
    }
    return true;
  } catch (e) {
    if (e.code === 404) return null; // not found
    throw e;
  }
}

async function main() {
  let ok = 0, skip = 0, fail = 0;
  for (const fnId of SLUG_TOOLS) {
    process.stdout.write(`${fnId.padEnd(45)} `);
    try {
      const result = await setVarsForFn(fnId);
      if (result === null) { console.log('SKIP (not found)'); skip++; }
      else { console.log('✓'); ok++; }
    } catch(e) {
      if (e.code === 429) {
        console.log('Rate limited, wait 20s...');
        await sleep(20000);
        try {
          await setVarsForFn(fnId);
          console.log('✓ (retry)'); ok++;
        } catch (e2) {
          console.log('FAIL:', e2.message); fail++;
        }
      } else {
        console.log('FAIL:', e.code, e.message); fail++;
      }
    }
    await sleep(300);
  }
  console.log(`\n=== DONE: ${ok} ok, ${skip} skipped, ${fail} failed ===`);
}

main();
