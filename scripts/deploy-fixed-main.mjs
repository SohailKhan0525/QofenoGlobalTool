/**
 * deploy-fixed-main.mjs
 * Copies scripts/shared-main-template.js to all 8 tool functions as main.js
 * then redeploys each to Appwrite Cloud
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, createReadStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import AdmZip from 'adm-zip';
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

async function deployFunction(fnId) {
  const fnDir = join(ROOT, 'functions', fnId);
  const srcDir = join(fnDir, 'src');
  if (!existsSync(srcDir)) {
    console.log(`  ⚠️  ${fnId}: src directory not found, skipping.`);
    return;
  }

  // Write fixed main.js
  const mainPath = join(srcDir, 'main.js');
  writeFileSync(mainPath, mainTemplate, 'utf-8');
  console.log(`  ✅ Updated main.js for ${fnId}`);

  // Zip the function
  const zip = new AdmZip();
  zip.addLocalFolder(fnDir);
  const zipBuffer = zip.toBuffer();

  // Upload deployment
  const formData = new FormData();
  const blob = new Blob([zipBuffer], { type: 'application/zip' });
  formData.append('code', blob, 'code.tar.gz');
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
    console.log(`  🚀 Deployed ${fnId}: deployment ${data.$id} (status: ${data.status})`);
  } else {
    console.log(`  ❌ Failed to deploy ${fnId}: ${JSON.stringify(data)}`);
  }
}

(async () => {
  console.log("\n=== DEPLOYING FIXED MAIN.JS TO ALL 8 TOOL FUNCTIONS ===\n");
  for (const fnId of FUNCTIONS) {
    console.log(`Processing ${fnId}...`);
    try {
      await deployFunction(fnId);
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}`);
    }
  }
  console.log("\n✅ All deployments triggered!");
})();
