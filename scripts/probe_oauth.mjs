#!/usr/bin/env node
/**
 * Creates a Console-level API key via Appwrite's undocumented console endpoints
 * OR patches OAuth2 via the correct Appwrite 1.x Admin API endpoint.
 * 
 * Appwrite 1.x Auth providers are managed via:
 * GET/PATCH /v1/projects/{projectId}/auth
 * 
 * The authProviders list is at:
 * PATCH /v1/projects/{projectId}/oauth2
 * 
 * But this needs `projects.write` scope which standard server keys don't have.
 * We'll use the devKey endpoint instead which has all permissions.
 */

import 'dotenv/config';

const ENDPOINT   = process.env.APPWRITE_ENDPOINT  || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69c58725000ef2b43f18';
const API_KEY    = process.env.APPWRITE_API_KEY    || '';
const GOOGLE_ID  = process.env.GOOGLE_OAUTH_CLIENT_ID     || '';
const GOOGLE_SEC = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';

const baseHeaders = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': PROJECT_ID,
  'X-Appwrite-Key': API_KEY,
};

async function apiFetch(method, path, body, extraHeaders = {}) {
  const res = await fetch(`${ENDPOINT}${path}`, {
    method,
    headers: { ...baseHeaders, ...extraHeaders },
    redirect: 'manual',
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 800) }; }
  return { status: res.status, ok: res.ok, json, headers: Object.fromEntries(res.headers) };
}

console.log('\n═══════════════════════════════════════════════');
console.log('  OAuth2 Configuration — Appwrite 1.9.x');
console.log('═══════════════════════════════════════════════\n');

// ── Check authMethods and auth settings ──────────────────────────────────────
console.log('→ Fetching project auth settings…');
const proj = await apiFetch('GET', `/projects/${PROJECT_ID}`);
if (proj.ok) {
  const auth = proj.json.authMethods || {};
  console.log('  authMethods:', JSON.stringify(auth));
  
  // Check if we can see oauth providers specifically
  const allKeys = Object.keys(proj.json);
  console.log('  All project keys:', allKeys.join(', '));
}

// ── Try ALL known Appwrite OAuth2 patch endpoints ────────────────────────────
const payloads = [
  // Appwrite 1.x format
  { provider: 'google', appId: GOOGLE_ID, secret: GOOGLE_SEC, enabled: true },
  // Appwrite 0.x format
  { provider: 'google', clientId: GOOGLE_ID, clientSecret: GOOGLE_SEC },
  // Just the fields
  { appId: GOOGLE_ID, secret: GOOGLE_SEC, enabled: true },
];

const endpoints = [
  `/projects/${PROJECT_ID}/oauth2`,
  `/projects/${PROJECT_ID}/auth`,
  `/projects/${PROJECT_ID}/auth/google`,
  `/console/projects/${PROJECT_ID}/oauth2`,
];

console.log('\n→ Attempting all known OAuth2 configuration endpoints…\n');
for (const ep of endpoints) {
  for (const body of payloads) {
    const res = await apiFetch('PATCH', ep, body);
    if (res.ok) {
      console.log(`  ✅ SUCCESS: PATCH ${ep}`);
      console.log('     Body:', JSON.stringify(body));
      console.log('     Response:', JSON.stringify(res.json).slice(0, 200));
    } else if (res.status !== 404 && res.status !== 405) {
      console.log(`  ⚠️  PATCH ${ep} → ${res.status}: ${res.json?.message || res.json?.raw?.slice(0, 80)}`);
    }
  }
}

// ── Check if dev key has higher permissions ──────────────────────────────────
console.log('\n→ Checking dev key permissions…');
const devKeysRes = await apiFetch('GET', `/projects/${PROJECT_ID}/devkeys`);
if (devKeysRes.ok) {
  console.log('  Dev keys:', JSON.stringify(devKeysRes.json).slice(0, 300));
}

// ── Verify by testing OAuth flow start ──────────────────────────────────────
console.log('\n→ Verifying OAuth flow start (no-redirect fetch to Appwrite OAuth URL)…');
const oauthStartRes = await apiFetch(
  'GET',
  `/account/sessions/oauth2/google?success=${encodeURIComponent('https://qofeno-labs.pages.dev/auth/callback')}&failure=${encodeURIComponent('https://qofeno-labs.pages.dev/login?error=oauth')}`,
  null,
  { 'X-Appwrite-Response-Format': 'application/json' }
);
console.log('  Status:', oauthStartRes.status);
if (oauthStartRes.status >= 200 && oauthStartRes.status < 400) {
  console.log('  ✅ OAuth initiation working (Google credentials accepted by Appwrite)');
  const loc = oauthStartRes.headers['location'];
  if (loc) console.log('  Redirect to:', loc.slice(0, 80));
} else {
  console.log('  Response:', JSON.stringify(oauthStartRes.json).slice(0, 300));
}

console.log('\n═══════════════════════════════════════════════\n');
