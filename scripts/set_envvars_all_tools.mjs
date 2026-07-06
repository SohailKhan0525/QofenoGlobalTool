/**
 * set_envvars_all_tools.mjs
 * Sets all required environment variables on every deployed tool function.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, Functions } from 'node-appwrite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const match = trimmed.match(/^(\w+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
}

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const functionsApi = new Functions(client);

const REQUIRED_ENV_VARS = {
  APPWRITE_ENDPOINT: process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
  APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
  DATABASE_ID: process.env.DATABASE_ID || 'qofeno_db',
  BUCKET_INPUTS: process.env.BUCKET_INPUTS || 'tool_inputs',
  BUCKET_OUTPUTS: process.env.BUCKET_OUTPUTS || 'tool_outputs',
};

// All individually deployed tool functions (using slug as ID)
const TOOL_FUNCTION_IDS = [
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
  // These have real IDs
  '87247f45bdec42938c2a6b91327f443c', // video-compressor
  '8c080e4c98364dbb929aa086d5add63c', // video-trimmer
  // Also update older PDF tools
  'pdf-compressor', 'pdf-compare', 'pdf-crop',
  'batch-compress-pdfs', 'batch-convert-pdfs', 'batch-merge-pdfs',
  'pdf-booklet-creator', 'pdf-color-converter', 'pdf-delete-pages',
  'pdf-extract-pages', 'pdf-flatten', 'pdf-form-creator', 'pdf-form-filler',
  'pdf-grayscale', 'pdf-header-footer', 'pdf-metadata-editor', 'pdf-metadata-viewer',
  'pdf-ocr', 'pdf-page-extractor-bulk', 'pdf-page-number-customizer', 'pdf-page-numbers',
  'pdf-portfolio-creator', 'pdf-protect', 'pdf-redact', 'pdf-reorder-pages',
  'pdf-repair', 'pdf-resize', 'pdf-rotate', 'pdf-sign', 'pdf-thumbnail',
  'pdf-to-excel', 'pdf-to-html', 'pdf-to-jpg', 'pdf-to-powerpoint', 'pdf-to-text',
  'pdf-unlock', 'pdf-watermark', 'pdf-word-count', 'powerpoint-to-pdf',
  'word-to-pdf', 'excel-to-pdf', 'image-bg-remover', 'jpg-to-pdf',
  'json-formatter', 'base64-encoder',
  // PDF IDs that are hashes
  '6a3a30d800079f455490', '6a3a30d8001713f1d384', '6a3a30d800287f27fcd3',
  '6a3a30d80037fb5d58d3', '6a3a30d900086391ba3e', '6a3a30d900178f5ade6a',
  '6a3a30d900279d6bbb49', '6a3a30d90037b4ac3991', '6a3a30da00081678077c',
  '6a3a30da0016e6669497', '6a3a30da0026b3af1496', '6a3a30da00352c4279c5',
  '6a3a30db000746154721', '6a3a30db00169465b2f9', '6a3a30db00291d1ca6b3',
  '6a3a30db003a88c11808', '6a3a30dc000b9e4465ce', '6a3a30dc001a34fbf18a',
  '6a3a30dc002a26ac1fb3', '6a3a30dc0039b6f69e0b', '6a3a30dd000ae7b436a9',
  '6a3a30dd0019e6e42c73', '6a3a30dd0028f47e8dc7', '6a3a30dd0038b66f7848',
  '6a3a30de00088000800e', '6a3a30de001796513bf9', '6a3a30de0026c28796e8',
  '6a3a30de0037fb68798e', '6a3a30df0009688e2229',
  'cb5981a795a5416a861978a439b87248', // pdf-merger
  '51e250ec1a6c4ac786cd918a8f0591ee', // pdf-splitter
  '48a0dec620be4bad888275cd6c0e11ae', // pdf-to-word
  'e0c0e1f5d9d2493785f0383c37137f56', // tools-pdf-compressor
];

// Deduplicate
const UNIQUE_IDS = [...new Set(TOOL_FUNCTION_IDS)];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function setEnvVarsForFunction(functionId) {
  try {
    // Get existing variables
    let existing = { variables: [] };
    try {
      existing = await functionsApi.listVariables(functionId);
    } catch (e) {
      if (e.code === 404) {
        console.log(`  SKIP: Function ${functionId} not found`);
        return false;
      }
      throw e;
    }
    
    const existingMap = Object.fromEntries(existing.variables.map(v => [v.key, v.$id]));
    
    let success = true;
    for (const [key, value] of Object.entries(REQUIRED_ENV_VARS)) {
      if (!value) {
        console.log(`  WARN: ${key} is empty, skipping`);
        continue;
      }
      try {
        if (existingMap[key]) {
          await functionsApi.updateVariable(functionId, existingMap[key], key, value);
        } else {
          await functionsApi.createVariable(functionId, key, value);
        }
      } catch (e) {
        if (e.code === 429) {
          console.log(`  Rate limited, waiting 15s...`);
          await sleep(15000);
          // Retry once
          try {
            if (existingMap[key]) {
              await functionsApi.updateVariable(functionId, existingMap[key], key, value);
            } else {
              await functionsApi.createVariable(functionId, key, value);
            }
          } catch (e2) {
            console.log(`  FAILED ${key}: ${e2.message}`);
            success = false;
          }
        } else {
          console.log(`  FAILED ${key}: ${e.message}`);
          success = false;
        }
      }
    }
    return success;
  } catch (e) {
    console.log(`  ERROR for ${functionId}: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log(`Setting env vars for ${UNIQUE_IDS.length} functions...\n`);
  console.log('Env vars to set:');
  for (const [k, v] of Object.entries(REQUIRED_ENV_VARS)) {
    console.log(`  ${k}=${v ? v.substring(0,20) + '...' : 'MISSING!'}`);
  }
  console.log('');
  
  let succeeded = 0;
  let failed = 0;
  
  for (const functionId of UNIQUE_IDS) {
    process.stdout.write(`Setting vars for ${functionId.substring(0, 35)}...`);
    const ok = await setEnvVarsForFunction(functionId);
    if (ok) { process.stdout.write(' ✓\n'); succeeded++; }
    else { process.stdout.write(' ✗\n'); failed++; }
    await sleep(500); // Rate limit protection
  }
  
  console.log(`\n=== DONE: ${succeeded} succeeded, ${failed} failed ===`);
}

main().catch(console.error);
