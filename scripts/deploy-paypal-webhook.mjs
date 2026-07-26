import fs from 'fs';
import path from 'path';
import { Client, Functions } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import * as tar from 'tar';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) throw new Error('.env file not found');

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(\w+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  }
}

async function run() {
  loadEnv();
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

  const targetDir = path.resolve(process.cwd(), 'functions', 'paypal-webhook');
  const functionId = 'paypal-webhook';

  console.log(`Deploying function ${functionId} from ${targetDir}...`);

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

  console.log('Updating function permissions & env vars...');
  try {
    await functionsApi.update(
      functionId,
      'platform-paypal-webhook',
      'node-18.0',
      ['any'], // Execute permissions for public webhooks
      undefined,
      undefined,
      15,
      true,
      true,
      'src/main.js',
      'npm install',
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
      [
        { key: 'PAYPAL_MODE', value: process.env.PAYPAL_MODE || 'live' },
        { key: 'PAYPAL_CLIENT_ID', value: process.env.PAYPAL_CLIENT_ID || '' },
        { key: 'PAYPAL_CLIENT_SECRET', value: process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET || '' },
        { key: 'PAYPAL_SECRET', value: process.env.PAYPAL_SECRET || process.env.PAYPAL_CLIENT_SECRET || '' },
        { key: 'PAYPAL_WEBHOOK_ID', value: process.env.PAYPAL_WEBHOOK_ID || '' },
        { key: 'DATABASE_ID', value: process.env.DATABASE_ID || 'qofeno_db' },
        { key: 'RESEND_API_KEY', value: process.env.RESEND_API_KEY || '' },
        { key: 'EMAIL_FROM_ADDRESS', value: process.env.EMAIL_FROM_ADDRESS || 'hello@qofeno.dev' },
        { key: 'EMAIL_FROM_NAME', value: process.env.EMAIL_FROM_NAME || 'Qofeno' },
        { key: 'APP_URL', value: process.env.APP_URL || 'https://qofeno-labs.pages.dev' },
      ]
    );
    console.log('✅ Updated paypal-webhook function permissions to [any] and synced environment variables');
  } catch (updateErr) {
    console.warn('⚠️ Warning updating function settings:', updateErr.message);
  }

  console.log('Uploading code.tar.gz deployment...');
  const deployment = await functionsApi.createDeployment(
    functionId,
    InputFile.fromPath(tarPath, 'code.tar.gz'),
    true, // activate immediately
    'src/main.js',
    'npm install'
  );

  console.log(`✓ Function ${functionId} successfully deployed! Deployment ID: ${deployment.$id}`);
  
  if (fs.existsSync(tarPath)) fs.unlinkSync(tarPath);
}

run().catch(console.error);
