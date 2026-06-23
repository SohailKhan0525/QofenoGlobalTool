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
    path.resolve(process.cwd(), '.env'),
    path.resolve(scriptDir, '..', '.env'),
  ];
  const envPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!envPath) throw new Error('Unable to find .env or .env.server');

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
  if (!value) throw new Error(`${name} is required in .env`);
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
  if (method === 'DELETE' && res.status === 204) return null;
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

function categorizeSlug(slug) {
  if (slug.includes('pdf') || slug.includes('word') || slug.includes('excel') || slug.includes('powerpoint')) return { cat: 'PDF & Documents', icon: 'faFileLines' };
  if (slug.includes('video') || slug.match(/(mp4|mov|avi|webm)/)) return { cat: 'Video Tools', icon: 'faVideo' };
  if (slug.includes('image') || slug.match(/(jpg|png|webp|avif|blur|sharpen|brightness|contrast)/)) return { cat: 'Image Tools', icon: 'faImageIcon' };
  if (slug.includes('audio') || slug.match(/(mp3|wav|ogg|flac|aac|volume|pitch|bass|silence|fade|ringtone)/)) return { cat: 'Audio Tools', icon: 'faMusic' };
  if (slug.includes('json') || slug.includes('base64') || slug.includes('text')) return { cat: 'Developer Tools', icon: 'faCode' };
  return { cat: 'AI & Automation', icon: 'faRobot' };
}

function subcategorize(slug) {
  if (slug.includes('compress')) return 'Compressors';
  if (slug.includes('convert') || slug.includes('to')) return 'Converters';
  if (slug.includes('merge') || slug.includes('combine')) return 'Combiners';
  if (slug.includes('split') || slug.includes('extract')) return 'Separators';
  if (slug.includes('manipulator') || slug.includes('edit')) return 'Editors';
  if (slug.includes('resize') || slug.includes('crop') || slug.includes('trim')) return 'Resizers';
  return 'Utilities';
}

function formatName(slug) {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace('Pdf', 'PDF')
    .replace('Jpg', 'JPG')
    .replace('Html', 'HTML')
    .replace('Json', 'JSON')
    .replace('Ocr', 'OCR')
    .replace('Bg', 'Background');
}

function determineType(slug) {
  const proKeywords = ['ocr', 'protect', 'unlock', 'watermark', 'sign', 'repair', 'compare'];
  return proKeywords.some(k => slug.includes(k)) ? 'Pro' : 'Free';
}

async function clearTools(dbId) {
  console.log("Fetching all tools to delete...");
  let deletedCount = 0;
  while (true) {
    const res = await request('GET', `/databases/${dbId}/collections/tools/documents`);
    if (res.documents.length === 0) break;
    console.log(`Found ${res.documents.length} tools to delete in this batch.`);
    for (const doc of res.documents) {
      await request('DELETE', `/databases/${dbId}/collections/tools/documents/${doc.$id}`);
      console.log(`Deleted ${doc.$id}`);
      deletedCount++;
    }
  }
  console.log(`Total deleted: ${deletedCount}`);
}

async function seedTools(dbId, tools) {
  for (const tool of tools) {
    const payload = {
      slug: tool.slug,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      subcategory: tool.subcategory,
      is_free: tool.is_free,
      is_new: tool.is_new,
      function_id: tool.function_id,
      icon: tool.icon || '',
      tags: tool.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await request('POST', `/databases/${dbId}/collections/tools/documents`, { documentId: tool.slug, data: payload });
      console.log(`Created ${tool.slug}`);
    } catch (error) {
      if (Number(error?.status) === 409) {
        await request('PATCH', `/databases/${dbId}/collections/tools/documents/${tool.slug}`, { data: payload });
        console.log(`Updated ${tool.slug}`);
      } else {
        throw error;
      }
    }
  }
}

async function main() {
  loadEnv();
  assertEnv('APPWRITE_ENDPOINT');
  assertEnv('APPWRITE_PROJECT_ID');
  assertEnv('APPWRITE_API_KEY');

  const toolsDir = path.join(process.cwd(), 'appwrite-functions', 'tools');
  const directories = fs.readdirSync(toolsDir).filter(f => fs.statSync(path.join(toolsDir, f)).isDirectory());

  const dbId = process.env.DATABASE_ID || 'qofeno_db';
  
  await clearTools(dbId);

  const toolsToSeed = directories.map(slug => {
    const { cat, icon } = categorizeSlug(slug);
    const subcat = subcategorize(slug);
    const name = formatName(slug);
    const type = determineType(slug);
    
    const envKey = `VITE_APPWRITE_FUNCTION_${slug.toUpperCase().replace(/-/g, '_')}_ID`;
    const functionId = process.env[envKey] || slug;

    return {
      slug,
      name,
      category: cat,
      subcategory: subcat,
      description: `High-quality ${name} tool running directly in your browser or securely on our servers.`,
      is_free: type === 'Free',
      is_new: true,
      function_id: functionId,
      icon: icon,
      tags: slug.split('-'),
    };
  });

  await seedTools(dbId, toolsToSeed);

  console.log(`Successfully seeded ${toolsToSeed.length} tools to Appwrite Database!`);
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
