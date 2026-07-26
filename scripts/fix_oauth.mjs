#!/usr/bin/env node
/**
 * Appwrite OAuth2 Diagnostic & Fix Script
 * Checks Google OAuth2 config, platforms, and attempts to set credentials via Admin API.
 */

import 'dotenv/config';

const ENDPOINT    = process.env.APPWRITE_ENDPOINT  || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID  = process.env.APPWRITE_PROJECT_ID || '69c58725000ef2b43f18';
const API_KEY     = process.env.APPWRITE_API_KEY    || '';
const GOOGLE_ID   = process.env.GOOGLE_OAUTH_CLIENT_ID     || '';
const GOOGLE_SEC  = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';

const headers = {
  'Content-Type':      'application/json',
  'X-Appwrite-Project': PROJECT_ID,
  'X-Appwrite-Key':    API_KEY,
};

async function req(method, path, body) {
  const url = `${ENDPOINT}${path}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, json };
}

function ok(label, v)  { console.log(`  ✅ ${label}: ${v}`); }
function err(label, v) { console.log(`  ❌ ${label}: ${v}`); }
function info(label, v){ console.log(`  ℹ️  ${label}: ${v}`); }

console.log('\n══════════════════════════════════════════════');
console.log('  Appwrite OAuth2 Diagnostic & Fix');
console.log('══════════════════════════════════════════════\n');

// ── 1. Validate env vars ─────────────────────────────────────────────────────
console.log('1. Environment Variables');
if (ENDPOINT)   ok('Endpoint', ENDPOINT);   else err('Endpoint', 'MISSING');
if (PROJECT_ID) ok('Project ID', PROJECT_ID); else err('Project ID', 'MISSING');
if (API_KEY)    ok('API Key', API_KEY.slice(0, 18) + '…'); else err('API Key', 'MISSING');
if (GOOGLE_ID)  ok('Google Client ID', GOOGLE_ID.slice(0, 30) + '…'); else err('Google Client ID', 'MISSING');
if (GOOGLE_SEC) ok('Google Client Secret', GOOGLE_SEC.slice(0, 12) + '…'); else err('Google Client Secret', 'MISSING');

// ── 2. Check project access ──────────────────────────────────────────────────
console.log('\n2. Appwrite Project Access');
const projRes = await req('GET', `/projects/${PROJECT_ID}`);
if (projRes.ok) {
  ok('Project fetch', `"${projRes.json.name}" (${projRes.json.$id})`);
} else {
  err('Project fetch', `${projRes.status} — ${JSON.stringify(projRes.json)}`);
  console.log('\n  ⚠️  API key may not have projects.read scope. Trying account endpoint…');
}

// ── 3. List current OAuth2 providers ─────────────────────────────────────────
console.log('\n3. Current OAuth2 Providers');
let googleEnabled = false;
let googleConfigured = false;
const oauthRes = await req('GET', `/projects/${PROJECT_ID}/oauth2`);
if (oauthRes.ok) {
  const providers = oauthRes.json.providers || oauthRes.json || [];
  const googleProvider = Array.isArray(providers)
    ? providers.find(p => p.name === 'google' || p.key === 'google')
    : (oauthRes.json.google || null);
  if (googleProvider) {
    const enabled = googleProvider.enabled ?? false;
    const hasAppId = !!(googleProvider.appId || googleProvider.clientId);
    googleEnabled = enabled;
    googleConfigured = hasAppId && enabled;
    if (enabled)  ok('Google OAuth', `Enabled, appId: ${googleProvider.appId || googleProvider.clientId || 'N/A'}`);
    else          err('Google OAuth', `Provider exists but DISABLED`);
  } else {
    err('Google OAuth', 'Not configured at all');
  }
  console.log('  Full response:', JSON.stringify(oauthRes.json).slice(0, 500));
} else {
  err('OAuth2 list', `${oauthRes.status} — ${JSON.stringify(oauthRes.json).slice(0, 300)}`);
}

// ── 4. Try to configure / enable Google OAuth ─────────────────────────────────
console.log('\n4. Configuring Google OAuth2');
if (!GOOGLE_ID || !GOOGLE_SEC) {
  err('Config', 'Missing GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET in .env');
} else {
  // Try PATCH endpoint (Appwrite 1.x project management API)
  const patchRes = await req('PATCH', `/projects/${PROJECT_ID}/oauth2`, {
    provider: 'google',
    appId:    GOOGLE_ID,
    secret:   GOOGLE_SEC,
    enabled:  true,
  });
  if (patchRes.ok) {
    ok('Google OAuth configured', 'Done');
    console.log('  Response:', JSON.stringify(patchRes.json).slice(0, 300));
  } else {
    err('PATCH /oauth2', `${patchRes.status} — ${JSON.stringify(patchRes.json).slice(0, 300)}`);

    // Try alternative endpoint format
    const patchRes2 = await req('PATCH', `/projects/${PROJECT_ID}/oauth2`, {
      provider: 'google',
      appId:    GOOGLE_ID,
      secret:   GOOGLE_SEC,
    });
    if (patchRes2.ok) {
      ok('Google OAuth configured (v2)', 'Done');
    } else {
      err('PATCH /oauth2 (v2)', `${patchRes2.status} — ${JSON.stringify(patchRes2.json).slice(0, 300)}`);
      info('Manual fix needed', 'Go to Appwrite Console → Auth → Settings → OAuth2 → Google');
      info('App ID', GOOGLE_ID);
      info('Secret', GOOGLE_SEC);
    }
  }
}

// ── 5. List registered Web Platforms ─────────────────────────────────────────
console.log('\n5. Registered Web Platforms');
const platRes = await req('GET', `/projects/${PROJECT_ID}/platforms`);
if (platRes.ok) {
  const platforms = platRes.json.platforms || platRes.json || [];
  const webPlats = Array.isArray(platforms) ? platforms.filter(p => p.type === 'web') : [];
  if (webPlats.length === 0) {
    err('Web Platforms', 'NONE REGISTERED — this causes CORS rejections on all API calls!');
    console.log('\n  ⚠️  Go to Appwrite Console → Settings → Platforms → Add Platform → Web');
    console.log('      Hostname: qofeno-labs.pages.dev');
  } else {
    webPlats.forEach(p => {
      const hasOurDomain = (p.hostname || '').includes('qofeno-labs.pages.dev');
      if (hasOurDomain) ok('Platform', `${p.name} → ${p.hostname}`);
      else              info('Platform', `${p.name} → ${p.hostname}`);
    });
    const hasDomain = webPlats.some(p => (p.hostname || '').includes('qofeno-labs.pages.dev'));
    if (!hasDomain) {
      err('qofeno-labs.pages.dev', 'NOT registered as a platform!');
      // Try to register it
      console.log('\n  Attempting to register qofeno-labs.pages.dev as platform…');
      const addPlatRes = await req('POST', `/projects/${PROJECT_ID}/platforms`, {
        type:     'web',
        name:     'Qofeno Production',
        hostname: 'qofeno-labs.pages.dev',
      });
      if (addPlatRes.ok) ok('Platform added', 'qofeno-labs.pages.dev registered');
      else err('Platform add', `${addPlatRes.status} — ${JSON.stringify(addPlatRes.json).slice(0, 300)}`);
    }
  }
} else {
  err('Platforms list', `${platRes.status} — ${JSON.stringify(platRes.json).slice(0, 300)}`);
}

// ── 6. Test account.get() (server-side will fail — just for info) ─────────────
console.log('\n6. Session Test (server-side, no cookie)');
const acctRes = await req('GET', '/account');
// Server-side won't have a session cookie, so 401 is expected
if (acctRes.status === 401) {
  info('account.get', '401 expected server-side (no session cookie). This is correct.');
  info('Implication', 'If client-side also gets 401 after OAuth, it means no session was created.');
} else if (acctRes.ok) {
  ok('account.get', `User: ${acctRes.json.email || acctRes.json.$id}`);
} else {
  info('account.get', `${acctRes.status}: ${JSON.stringify(acctRes.json).slice(0, 100)}`);
}

console.log('\n══════════════════════════════════════════════');
console.log('  Done. Check items marked ❌ above.');
console.log('══════════════════════════════════════════════\n');
