/**
 * fix-and-redeploy.mjs
 * 1. Copies fixed main.js to all 8 functions
 * 2. Redeploys via Appwrite API using tar + fetch
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative, sep } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const endpoint = (process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1').replace(/\/$/, '');
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

const FUNCTIONS = [
  'qofeno-pdf', 'qofeno-image', 'qofeno-video', 'qofeno-audio',
  'qofeno-text', 'qofeno-developer', 'qofeno-data', 'qofeno-security'
];

const mainTemplate = readFileSync(join(ROOT, 'scripts/shared-main-template.js'), 'utf-8');

// Step 1: Update all main.js files locally
console.log("\n=== STEP 1: UPDATING MAIN.JS IN ALL FUNCTIONS ===\n");
for (const fnId of FUNCTIONS) {
  const mainPath = join(ROOT, 'functions', fnId, 'src', 'main.js');
  if (existsSync(mainPath)) {
    writeFileSync(mainPath, mainTemplate, 'utf-8');
    console.log(`  ✅ Updated: functions/${fnId}/src/main.js`);
  } else {
    console.log(`  ⚠️  Not found: ${mainPath}`);
  }
}

// Step 2: Redeploy via Appwrite API using tar.gz
console.log("\n=== STEP 2: REDEPLOYING ALL FUNCTIONS VIA APPWRITE API ===\n");

import { execSync } from 'child_process';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';

async function deployFunctionViaTar(fnId) {
  const fnDir = join(ROOT, 'functions', fnId);
  if (!existsSync(fnDir)) {
    console.log(`  ⚠️  ${fnId}: directory not found`);
    return;
  }

  // Create tar.gz of the function directory
  const tarPath = join(tmpdir(), `${fnId}.tar.gz`);
  try {
    execSync(`tar -czf "${tarPath}" -C "${fnDir}" .`, { stdio: 'pipe' });
  } catch (e) {
    // On Windows, try 7zip or powershell
    try {
      execSync(`powershell Compress-Archive -Path "${fnDir}\\*" -DestinationPath "${tarPath.replace('.tar.gz', '.zip')}" -Force`, { stdio: 'pipe' });
    } catch {}
  }

  const tarBuffer = existsSync(tarPath) ? readFileSync(tarPath) : null;
  if (!tarBuffer) {
    console.log(`  ❌ Could not create archive for ${fnId}`);
    return;
  }

  const formData = new FormData();
  const blob = new Blob([tarBuffer], { type: 'application/x-gzip' });
  formData.append('code', blob, `${fnId}.tar.gz`);
  formData.append('entrypoint', 'src/main.js');
  formData.append('commands', 'npm install');
  formData.append('activate', 'true');

  const r = await fetch(`${endpoint}/functions/${fnId}/deployments`, {
    method: 'POST',
    headers: {
      'X-Appwrite-Project': projectId,
      'X-Appwrite-Key': apiKey,
    },
    body: formData
  });

  const data = await r.json();
  if (r.ok && data.$id) {
    console.log(`  🚀 ${fnId}: deployment ${data.$id} triggered (${data.status})`);
  } else {
    console.log(`  ❌ ${fnId}: ${JSON.stringify(data).substring(0, 200)}`);
  }
}

for (const fnId of FUNCTIONS) {
  console.log(`Deploying ${fnId}...`);
  try {
    await deployFunctionViaTar(fnId);
  } catch (e) {
    console.log(`  ❌ Error deploying ${fnId}: ${e.message}`);
  }
}

console.log("\nDone! Check Appwrite console for deployment status.");
