/**
 * deploy_media_tools.mjs
 * Deploys all audio/image/video tool functions that need code updates or creation.
 * Uses slug names as function IDs (so they can be referenced by their slug in .env).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, Functions } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import * as tar from 'tar';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const endpoint = process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!projectId || !apiKey) {
  console.error('Missing APPWRITE_PROJECT_ID or APPWRITE_API_KEY');
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const functionsApi = new Functions(client);

// These are the tools to deploy - all the ones that were fixed for base64 or don't exist yet
const TOOLS_TO_DEPLOY = [
  'aac-converter', 'audio-compressor', 'audio-metadata-viewer', 'audio-reverser',
  'avi-converter', 'background-noise-remover', 'bass-booster', 'blur-image',
  'brightness-adjust', 'change-pitch', 'change-speed', 'contrast-adjust',
  'crop-image', 'extract-audio', 'fade-in', 'fade-out', 'flac-converter',
  'flip-image', 'gif-maker-video',
  // These exist but need updated code (base64 fix was applied)
  'image-bg-remover', 'image-compressor', 'image-converter', 'image-resizer',
  'jpg-to-pdf',
  'merge-audio', 'merge-videos', 'mov-converter', 'mp3-converter', 'mp4-converter',
  'ogg-converter', 'remove-audio', 'ringtone-maker', 'rotate-image', 'rotate-video',
  'sharpen-image', 'silence-remover', 'speed-changer-video', 'trim-audio',
  'volume-booster', 'watermark-image', 'wav-converter', 'webm-converter',
  // Also update these which have real IDs but need the fix deployed
  'video-compressor', 'video-trimmer',
];

const toolsDir = path.join(__dirname, '..', 'appwrite-functions', 'tools');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function deployTool(slug) {
  const fullDir = path.join(toolsDir, slug);
  if (!fs.existsSync(path.join(fullDir, 'src', 'main.js'))) {
    console.log(`SKIP: ${slug} - no main.js found`);
    return null;
  }

  // Get function ID - use real ID from env if available, otherwise use slug
  const envKey = 'VITE_APPWRITE_FUNCTION_' + slug.toUpperCase().replace(/-/g, '_') + '_ID';
  const envVal = process.env[envKey];
  const functionId = (envVal && envVal !== slug) ? envVal : slug;
  
  console.log(`\n--- Deploying: ${slug} (ID: ${functionId}) ---`);
  
  // Ensure function exists in Appwrite
  try {
    await functionsApi.get(functionId);
    console.log(`  Function ${functionId} exists, updating deployment...`);
  } catch (err) {
    if (err.code === 404) {
      console.log(`  Creating function ${functionId}...`);
      try {
        await functionsApi.create(functionId, slug, 'node-18.0', ['any']);
        await sleep(2000);
      } catch (createErr) {
        if (createErr.code === 429) {
          console.log('  Rate limited, waiting 30s...');
          await sleep(30000);
          await functionsApi.create(functionId, slug, 'node-18.0', ['any']);
        } else {
          console.error(`  FAILED to create function ${functionId}: ${createErr.message}`);
          return null;
        }
      }
    } else {
      console.error(`  FAILED to get function ${functionId}: ${err.message}`);
      return null;
    }
  }

  // Package and deploy code
  const tarPath = path.join(fullDir, 'code.tar.gz');
  try {
    if (fs.existsSync(tarPath)) fs.unlinkSync(tarPath);
    
    const filesToTar = [];
    if (fs.existsSync(path.join(fullDir, 'package.json'))) filesToTar.push('package.json');
    if (fs.existsSync(path.join(fullDir, 'src'))) filesToTar.push('src');
    
    await tar.c({ gzip: true, file: tarPath, cwd: fullDir }, filesToTar);
    
    let deployed = false;
    let retries = 3;
    while (retries > 0 && !deployed) {
      try {
        const deployment = await functionsApi.createDeployment(
          functionId, 
          InputFile.fromPath(tarPath, 'code.tar.gz'), 
          true, 
          'src/main.js', 
          'npm install'
        );
        console.log(`  SUCCESS: Deployed ${slug}. Deployment ID: ${deployment.$id}`);
        deployed = true;
      } catch (depErr) {
        if (depErr.code === 429) {
          console.log('  Rate limited on deployment, waiting 20s...');
          await sleep(20000);
          retries--;
        } else {
          console.error(`  DEPLOY FAILED for ${slug}: ${depErr.message}`);
          retries = 0;
        }
      }
    }
    
    if (fs.existsSync(tarPath)) fs.unlinkSync(tarPath);
    
    return deployed ? functionId : null;
  } catch (err) {
    console.error(`  PACKAGE FAILED for ${slug}: ${err.message}`);
    if (fs.existsSync(tarPath)) try { fs.unlinkSync(tarPath); } catch {}
    return null;
  }
}

async function setEnvVars(functionId, slug) {
  const envVars = {
    APPWRITE_ENDPOINT: process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
    APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
    DATABASE_ID: process.env.DATABASE_ID || 'qofeno_db',
    BUCKET_INPUTS: process.env.BUCKET_INPUTS || 'tool_inputs',
    BUCKET_OUTPUTS: process.env.BUCKET_OUTPUTS || 'tool_outputs',
  };

  try {
    // Get existing variables
    const existing = await functionsApi.listVariables(functionId);
    const existingKeys = new Set(existing.variables.map(v => v.key));
    
    for (const [key, value] of Object.entries(envVars)) {
      if (!value) continue;
      try {
        if (existingKeys.has(key)) {
          const existingVar = existing.variables.find(v => v.key === key);
          await functionsApi.updateVariable(functionId, existingVar.$id, key, value);
        } else {
          await functionsApi.createVariable(functionId, key, value);
        }
      } catch (e) {
        console.log(`    Env var ${key} failed: ${e.message}`);
      }
    }
    console.log(`  ENV VARS SET for ${functionId}`);
  } catch (err) {
    console.error(`  FAILED to set env vars for ${functionId}: ${err.message}`);
  }
}

async function main() {
  console.log(`Starting deployment of ${TOOLS_TO_DEPLOY.length} media tool functions...\n`);
  
  const results = { success: [], failed: [] };
  
  for (const slug of TOOLS_TO_DEPLOY) {
    const functionId = await deployTool(slug);
    if (functionId) {
      results.success.push({ slug, functionId });
      // Set env vars after deployment
      await sleep(1000);
      await setEnvVars(functionId, slug);
    } else {
      results.failed.push(slug);
    }
    // Rate limit protection between functions
    await sleep(3000);
  }
  
  console.log('\n\n=== DEPLOYMENT SUMMARY ===');
  console.log(`Succeeded (${results.success.length}):`, results.success.map(r => r.slug).join(', '));
  console.log(`\nFailed (${results.failed.length}):`, results.failed.join(', '));
  
  // Generate .env updates
  console.log('\n\n=== ENV VARS TO UPDATE IN .env ===');
  for (const { slug, functionId } of results.success) {
    if (functionId !== slug) {
      const envKey = 'VITE_APPWRITE_FUNCTION_' + slug.toUpperCase().replace(/-/g, '_') + '_ID';
      console.log(`${envKey}=${functionId}`);
    }
  }
}

main().catch(console.error);
