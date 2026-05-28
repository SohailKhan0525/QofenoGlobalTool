#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function loadEnv() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(process.cwd(), '.env.server'),
    path.resolve(process.cwd(), 'QofenoGlobalTool', '.env.server'),
    path.resolve(scriptDir, '..', '.env.server'),
  ];
  const envPath = candidates.find(candidate => fs.existsSync(candidate));
  if (!envPath) throw new Error('Unable to find .env.server in repo root or QofenoGlobalTool folder');

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(\w+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  }
  return envPath;
}

function assertEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required in .env.server`);
  return value;
}

async function request(method, pathName, body) {
  const base = assertEnv('APPWRITE_ENDPOINT').replace(/\/$/, '');
  const res = await fetch(`${base}${pathName}`, {
    method,
    headers: {
      'X-Appwrite-Project': assertEnv('APPWRITE_PROJECT_ID'),
      'X-Appwrite-Key': assertEnv('APPWRITE_API_KEY'),
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!res.ok) {
    const error = new Error(`Appwrite ${method} ${pathName} failed: ${res.status} ${typeof json === 'string' ? json : JSON.stringify(json)}`);
    error.status = res.status;
    error.body = json;
    throw error;
  }

  return json;
}

async function tryUpdate(method, pathName, body, label) {
  try {
    await request(method, pathName, body);
    console.log(`${label}: ok`);
  } catch (error) {
    console.warn(`${label}: ${error.message}`);
  }
}

async function ensureWebPlatform(platformId, name, hostname) {
  try {
    await request('GET', `/project/platforms/${platformId}`);
    await request('PUT', `/project/platforms/web/${platformId}`, { platformId, name, hostname });
    console.log(`Web platform updated: ${platformId}`);
  } catch (error) {
    if (error.status !== 404) throw error;
    await request('POST', '/project/platforms/web', { platformId, name, hostname });
    console.log(`Web platform created: ${platformId}`);
  }
}

async function updateOAuthProvider(provider, payload) {
  if (!payload.enabled) {
    console.log(`${provider}: skipped (missing client id/secret in .env.server)`);
    return;
  }
  await request('PATCH', `/project/oauth2/${provider}`, payload);
  console.log(`${provider}: enabled`);
}

async function main() {
  const envPath = loadEnv();
  console.log(`Loaded env: ${envPath}`);
  assertEnv('APPWRITE_ENDPOINT');
  assertEnv('APPWRITE_PROJECT_ID');
  assertEnv('APPWRITE_API_KEY');

  await tryUpdate('PATCH', '/project/auth-methods/email-password', { enabled: true }, 'Email/password auth');
  await tryUpdate('PATCH', '/project/policies/session-duration', { duration: 60 * 60 * 24 * 30 }, 'Session duration (30 days)');
  await tryUpdate('PATCH', '/project/policies/session-limit', { total: 5 }, 'Session limit (5)');
  await tryUpdate('PATCH', '/project/policies/session-alert', { enabled: false }, 'Session alerts');
  await tryUpdate('PATCH', '/project/policies/session-invalidation', { enabled: true }, 'Session invalidation');

  const pagesDomain = process.env.CLOUDFLARE_PAGES_DOMAIN || 'qofeno-labs.pages.dev';
  await ensureWebPlatform('qofeno-pages', 'Qofeno Pages', pagesDomain);
  await ensureWebPlatform('qofeno-localhost', 'Qofeno Localhost', 'localhost');
  await ensureWebPlatform('qofeno-127', 'Qofeno Loopback', '127.0.0.1');

  await updateOAuthProvider('google', {
    clientId: process.env.APPWRITE_GOOGLE_CLIENT_ID,
    clientSecret: process.env.APPWRITE_GOOGLE_CLIENT_SECRET,
    enabled: Boolean(process.env.APPWRITE_GOOGLE_CLIENT_ID && process.env.APPWRITE_GOOGLE_CLIENT_SECRET),
  });

  await updateOAuthProvider('github', {
    clientId: process.env.APPWRITE_GITHUB_CLIENT_ID,
    clientSecret: process.env.APPWRITE_GITHUB_CLIENT_SECRET,
    enabled: Boolean(process.env.APPWRITE_GITHUB_CLIENT_ID && process.env.APPWRITE_GITHUB_CLIENT_SECRET),
  });

  console.log('Step 3 provisioning finished.');
}

main().catch(error => {
  console.error(error?.message || error);
  process.exit(1);
});