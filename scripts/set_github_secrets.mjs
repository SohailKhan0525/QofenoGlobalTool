#!/usr/bin/env node
// Usage:
// 1) Install dependencies: `npm install libsodium-wrappers node-fetch@2`
// 2) Create a JSON file with secrets, e.g. `github-secrets.json` in this folder:
//    {
//      "VITE_APPWRITE_ENDPOINT": "https://fra.cloud.appwrite.io/v1",
//      "CLOUDFLARE_API_TOKEN": "<token>"
//    }
// 3) Run:
//    GITHUB_PAT=<your_pat> node scripts/set_github_secrets.mjs --repo SohailKhan0525/QofenoGlobalTool github-secrets.json

import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import sodium from 'libsodium-wrappers';

async function encryptSecret(publicKey, secretValue) {
  await sodium.ready;
  const pk = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL);
  const secretBytes = sodium.from_string(secretValue);
  const cipherBytes = sodium.crypto_box_seal(secretBytes, pk);
  return sodium.to_base64(cipherBytes, sodium.base64_variants.ORIGINAL);
}

function usage() {
  console.log('Usage: GITHUB_PAT=<PAT> node scripts/set_github_secrets.mjs --repo owner/repo secrets.json');
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2 || args[0] !== '--repo') usage();
  const repo = args[1];
  const fileArg = args[2] || 'github-secrets.json';
  const pat = process.env.GITHUB_PAT;
  if (!pat) {
    console.error('GITHUB_PAT environment variable is required.');
    usage();
  }

  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    console.error('Invalid repo format. Use owner/repo');
    usage();
  }

  const filePath = path.resolve(process.cwd(), fileArg);
  let json;
  try {
    const content = await fs.readFile(filePath, 'utf8');
    json = JSON.parse(content);
  } catch (err) {
    console.error('Failed to read or parse secrets file:', err.message);
    process.exit(1);
  }

  const baseUrl = `https://api.github.com/repos/${owner}/${repoName}`;

  // fetch public key
  const pkResp = await fetch(`${baseUrl}/actions/secrets/public-key`, {
    method: 'GET',
    headers: {
      Authorization: `token ${pat}`,
      'User-Agent': 'set-github-secrets-script',
      Accept: 'application/vnd.github+json'
    }
  });

  if (!pkResp.ok) {
    const body = await pkResp.text();
    console.error('Failed to fetch public key:', pkResp.status, body);
    process.exit(1);
  }

  const pkJson = await pkResp.json();
  const publicKey = pkJson.key;
  const keyId = pkJson.key_id;

  for (const [name, value] of Object.entries(json)) {
    try {
      const encrypted = await encryptSecret(publicKey, String(value));
      const putResp = await fetch(`${baseUrl}/actions/secrets/${encodeURIComponent(name)}`, {
        method: 'PUT',
        headers: {
          Authorization: `token ${pat}`,
          'User-Agent': 'set-github-secrets-script',
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json'
        },
        body: JSON.stringify({ encrypted_value: encrypted, key_id: keyId })
      });
      if (!putResp.ok) {
        const b = await putResp.text();
        console.error(`Failed to set secret ${name}:`, putResp.status, b);
      } else {
        console.log(`Set secret ${name}`);
      }
    } catch (err) {
      console.error(`Error setting ${name}:`, err.message);
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
