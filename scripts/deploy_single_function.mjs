import fs from 'fs';
import path from 'path';
import { Client, Functions } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import * as tar from 'tar';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

async function run() {
  const endpoint = process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!projectId || !apiKey) {
    throw new Error('APPWRITE_PROJECT_ID and APPWRITE_API_KEY must be set in .env');
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const functionsApi = new Functions(client);

  const baseName = process.argv[2] || 'auth-webhook';
  let targetDir = path.resolve(process.cwd(), 'appwrite-functions', 'platform', baseName);
  if (!fs.existsSync(targetDir)) {
    targetDir = path.resolve(process.cwd(), 'appwrite-functions', 'tools', baseName);
  }
  if (!fs.existsSync(targetDir)) {
    targetDir = path.resolve(process.cwd(), 'appwrite-functions', baseName);
  }
  
  const envKeyName = baseName.toUpperCase().replace(/-/g, '_');
  const functionId = process.env[`VITE_APPWRITE_FUNCTION_${envKeyName}_ID`] || baseName;

  console.log(`Checking function ${functionId}...`);
  let functionExists = false;
  try {
    await functionsApi.get(functionId);
    console.log(`Function ${functionId} already exists.`);
    functionExists = true;
  } catch (err) {
    if (err.code === 404) {
      console.log(`Creating function ${functionId}...`);
      await functionsApi.create(functionId, baseName, 'node-18.0', ['any']);
      functionExists = true;
    } else {
      throw err;
    }
  }

  // Update events and configurations
  console.log(`Updating function triggers and configuration...`);
  let triggers = [];
  if (baseName === 'auth-webhook') triggers = ['users.*.create'];
  else if (baseName === 'new-tool-notifier') triggers = ['databases.*.collections.tools.documents.*.create'];
  else if (baseName === 'whats-new-notifier') triggers = ['databases.*.collections.whats_new.documents.*.create'];

  await functionsApi.update(
    functionId,
    baseName,
    'node-18.0',
    ['any'],
    triggers,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined
  );

  // Sync environment variables
  console.log(`Syncing environment variables for ${functionId}...`);
  const varsToSet = {
    APPWRITE_ENDPOINT: endpoint,
    APPWRITE_PROJECT_ID: projectId,
    APPWRITE_API_KEY: apiKey,
    DATABASE_ID: process.env.DATABASE_ID || 'qofeno_db',
    RESEND_API_KEY: process.env.RESEND_API_KEY || '',
    EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS || 'hello@qofeno.dev',
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'Qofeno',
    APP_URL: process.env.APP_URL || 'https://qofeno-labs.pages.dev'
  };

  const existingVarsRes = await functionsApi.listVariables(functionId);
  const existingVars = existingVarsRes.variables || [];

  for (const [key, value] of Object.entries(varsToSet)) {
    const valStr = String(value || '').trim();
    const existing = existingVars.find(v => v.key === key);
    if (existing) {
      if (existing.value !== valStr) {
        console.log(`Updating variable ${key}...`);
        await functionsApi.updateVariable({
          functionId,
          variableId: existing.$id,
          key,
          value: valStr
        });
      } else {
        console.log(`Variable ${key} is already up to date.`);
      }
    } else {
      try {
        console.log(`Creating variable ${key}...`);
        const safeVarId = key.toLowerCase().replace(/[^a-z0-9]/g, '-');
        await functionsApi.createVariable({
          functionId,
          variableId: safeVarId,
          key,
          value: valStr
        });
      } catch (varErr) {
        if (varErr.code === 409 || String(varErr.message).includes('already exists')) {
          console.log(`Variable ${key} already exists, skipping.`);
        } else {
          throw varErr;
        }
      }
    }
  }

  const tarPath = path.join(targetDir, 'code.tar.gz');
  if (fs.existsSync(tarPath)) fs.unlinkSync(tarPath);

  const filesToTar = [];
  if (fs.existsSync(path.join(targetDir, 'package.json'))) filesToTar.push('package.json');
  if (fs.existsSync(path.join(targetDir, 'src'))) filesToTar.push('src');

  await tar.c(
    {
      gzip: true,
      file: tarPath,
      cwd: targetDir
    },
    filesToTar
  );

  console.log('Uploading code.tar.gz deployment...');
  const deployment = await functionsApi.createDeployment(
    functionId,
    InputFile.fromPath(tarPath, 'code.tar.gz'),
    true, // activate immediately
    'src/main.js',
    'npm install'
  );

  console.log(`✓ Function ${functionId} successfully deployed and configured! Deployment ID: ${deployment.$id}`);
  
  if (fs.existsSync(tarPath)) fs.unlinkSync(tarPath);
}

run().catch(console.error);
