/**
 * fix_envvars_individual_tools.mjs
 * Sets env vars specifically for the individually-deployed slug-named functions.
 * Uses dotenvx which handles the .env properly.
 */
import { Client, Functions } from 'node-appwrite';
import 'dotenv/config';
import { config } from 'dotenv';

// Load .env explicitly 
config({ path: './env', override: true });

// The required values
const REQUIRED_VARS = {
  APPWRITE_ENDPOINT:    process.env.APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID:  process.env.APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY:     process.env.APPWRITE_API_KEY,
  DATABASE_ID:          process.env.DATABASE_ID || 'qofeno_db',
  BUCKET_INPUTS:        process.env.BUCKET_INPUTS || 'tool_inputs',
  BUCKET_OUTPUTS:       process.env.BUCKET_OUTPUTS || 'tool_outputs',
};

console.log('Loaded env vars:');
for (const [k, v] of Object.entries(REQUIRED_VARS)) {
  console.log(`  ${k}: ${v ? v.substring(0, 30) + '...' : 'MISSING!'}`);
}

if (!REQUIRED_VARS.APPWRITE_PROJECT_ID || !REQUIRED_VARS.APPWRITE_API_KEY) {
  console.error('FATAL: Missing critical env vars. Cannot proceed.');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(REQUIRED_VARS.APPWRITE_ENDPOINT)
  .setProject(REQUIRED_VARS.APPWRITE_PROJECT_ID)
  .setKey(REQUIRED_VARS.APPWRITE_API_KEY);

const functionsApi = new Functions(client);

// Only the slug-named functions that failed
const SLUG_FUNCTIONS = [
  'aac-converter', 'audio-compressor', 'audio-metadata-viewer', 'audio-reverser',
  'avi-converter', 'background-noise-remover', 'bass-booster', 'blur-image',
  'brightness-adjust', 'change-pitch', 'change-speed', 'contrast-adjust',
  'crop-image', 'extract-audio', 'fade-in', 'fade-out', 'flac-converter',
  'flip-image', 'gif-maker-video', 'image-bg-remover', 'image-compressor',
  'image-converter', 'image-resizer', 'jpg-to-pdf', 'merge-audio', 'merge-videos',
  'mov-converter', 'mp3-converter', 'mp4-converter', 'ogg-converter', 'remove-audio',
  'ringtone-maker', 'rotate-image', 'rotate-video', 'sharpen-image', 'silence-remover',
  'speed-changer-video', 'trim-audio', 'volume-booster', 'watermark-image',
  'wav-converter', 'webm-converter',
  // also batch PDF functions
  'batch-compress-pdfs', 'batch-convert-pdfs', 'batch-merge-pdfs',
  'pdf-booklet-creator', 'pdf-color-converter', 'pdf-delete-pages',
  'pdf-extract-pages', 'pdf-flatten',
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function setVarsForFunction(functionId) {
  try {
    // Verify function exists
    let fn;
    try {
      fn = await functionsApi.get(functionId);
    } catch (e) {
      if (e.code === 404) {
        console.log(`  SKIP ${functionId}: not found`);
        return false;
      }
      throw e;
    }
    
    // Get existing variables
    const existing = await functionsApi.listVariables(functionId);
    const existingMap = Object.fromEntries(existing.variables.map(v => [v.key, v.$id]));
    
    for (const [key, value] of Object.entries(REQUIRED_VARS)) {
      if (!value) continue;
      try {
        if (existingMap[key]) {
          await functionsApi.updateVariable(functionId, existingMap[key], key, value);
        } else {
          await functionsApi.createVariable(functionId, key, value);
        }
        await sleep(100);
      } catch (e) {
        if (e.code === 429) {
          await sleep(20000);
          if (existingMap[key]) {
            await functionsApi.updateVariable(functionId, existingMap[key], key, value);
          } else {
            await functionsApi.createVariable(functionId, key, value);
          }
        } else {
          console.log(`    WARN: ${key} = ${e.message}`);
        }
      }
    }
    return true;
  } catch (e) {
    console.log(`  ERROR ${functionId}: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log(`\nSetting env vars for ${SLUG_FUNCTIONS.length} slug-named functions...\n`);
  let ok = 0, fail = 0;
  
  for (const fnId of SLUG_FUNCTIONS) {
    process.stdout.write(`  ${fnId.padEnd(40)} `);
    const result = await setVarsForFunction(fnId);
    if (result) { console.log('✓'); ok++; }
    else { console.log('✗'); fail++; }
    await sleep(200);
  }
  
  console.log(`\n=== Result: ${ok} success, ${fail} failed ===`);
}

main().catch(err => { console.error(err); process.exit(1); });
