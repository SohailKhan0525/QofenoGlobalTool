import fs from 'fs';
import path from 'path';
import { Client, Functions, Query } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const functions = new Functions(client);

async function updateAppwriteEnvs() {
  console.log('Fetching Appwrite functions...');
  const allFunctions = [];
  let offset = 0;
  while (true) {
    const response = await functions.list([Query.limit(100), Query.offset(offset)]);
    allFunctions.push(...response.functions);
    if (allFunctions.length >= response.total) break;
    offset += 100;
  }

  const variablesToSet = {
    APPWRITE_ENDPOINT: process.env.APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
    DATABASE_ID: process.env.DATABASE_ID,
    BUCKET_INPUTS: process.env.BUCKET_INPUTS,
    BUCKET_OUTPUTS: process.env.BUCKET_OUTPUTS
  };

  for (const fn of allFunctions) {
    // Check existing variables
    console.log(`Updating vars for ${fn.name} (${fn.$id})...`);
    try {
      const existingVarsResponse = await functions.listVariables(fn.$id);
      const existingMap = {};
      existingVarsResponse.variables.forEach(v => { existingMap[v.key] = v.$id; });

      for (const [key, value] of Object.entries(variablesToSet)) {
        if (!value) continue;
        if (existingMap[key]) {
          await functions.updateVariable(fn.$id, existingMap[key], key, value);
        } else {
          await functions.createVariable(fn.$id, key.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() + Math.random().toString(36).slice(2, 6), key, value);
        }
      }
    } catch (e) {
      console.error(`Failed to update vars for ${fn.name}:`, e.message);
    }
  }
  console.log('Appwrite functions updated.');
}

async function updateCloudflareEnvs() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_KEY || process.env.CLOUDFLARE_API_TOKEN;
  const projectName = process.env.CLOUDFLARE_PAGES_PROJECT;

  if (!accountId || !token || !projectName) {
    console.log('Skipping Cloudflare env update, missing credentials.');
    return;
  }

  // Read .env line by line to get VITE_ and NEXT_PUBLIC_ variables
  const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const match = line.trim().match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      // Remove quotes if present
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      envVars[key] = { value: val };
    }
  });

  const body = {
    deployment_configs: {
      production: { env_vars: envVars },
      preview: { env_vars: envVars }
    }
  };

  console.log(`Updating Cloudflare Pages project ${projectName}...`);
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Failed to update Cloudflare envs:', res.status, text);
  } else {
    console.log('Cloudflare Pages envs updated successfully.');
  }
}

async function main() {
  await updateAppwriteEnvs();
  await updateCloudflareEnvs();
}

main();
