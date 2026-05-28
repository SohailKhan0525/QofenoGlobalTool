#!/usr/bin/env node
import { existsSync } from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.server first, then fallback to .env
const root = path.resolve(new URL(import.meta.url).pathname).split('/').slice(0,-3).join('/');
const envServer = path.resolve(process.cwd(), '..', '.env.server');
const envRoot = path.resolve(process.cwd(), '.env');
if (existsSync(envServer)) dotenv.config({ path: envServer });
else if (existsSync(envRoot)) dotenv.config({ path: envRoot });

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_KEY || process.env.CLOUDFLARE_API_TOKEN;
const PROJECT = process.env.CLOUDFLARE_PAGES_PROJECT || process.env.CLOUDFLARE_PROJECT || process.env.CLOUDFLARE_PAGES_PROJECT_NAME;
const DIST_DIR = path.resolve(process.cwd(), 'dist');

if (!CLOUDFLARE_API_TOKEN) {
  console.error('Missing CLOUDFLARE_API_TOKEN / CLOUDFLARE_API_KEY in environment (.env.server)');
  process.exit(1);
}
if (!PROJECT) {
  console.error('Missing CLOUDFLARE_PAGES_PROJECT in environment (.env.server)');
  process.exit(1);
}
if (!existsSync(DIST_DIR)) {
  console.error('Dist directory not found:', DIST_DIR);
  process.exit(1);
}

console.log('Deploying', DIST_DIR, 'to Cloudflare Pages project', PROJECT);

const child = spawn('npx', ['-y', 'wrangler@3', 'pages', 'deploy', DIST_DIR, '--project-name', PROJECT, '--branch', 'main'], {
  stdio: 'inherit',
  env: { ...process.env, CLOUDFLARE_API_TOKEN }
});

child.on('exit', (code) => {
  if (code === 0) {
    console.log('Pages deploy finished successfully');
    process.exit(0);
  }
  console.error('Pages deploy failed with exit code', code);
  process.exit(code || 1);
});
