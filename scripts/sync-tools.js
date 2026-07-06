import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^(\w+)=(.*)$/);
      if (match) process.env[match[1]] = match[2];
    }
  }
}

async function request(method, pathName, body) {
  const base = (process.env.APPWRITE_ENDPOINT || '').replace(/\/$/, '');
  const res = await fetch(`${base}${pathName}`, {
    method,
    headers: {
      'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID || '',
      'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
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
    throw new Error(`Appwrite ${method} ${pathName} failed: ${res.status} ${JSON.stringify(json)}`);
  }
  return json;
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

async function main() {
  loadEnv();
  
  const dbId = process.env.DATABASE_ID || 'qofeno_db';
  const toolsDir = path.join(process.cwd(), 'appwrite-functions', 'tools');
  const directories = fs.readdirSync(toolsDir).filter(f => fs.statSync(path.join(toolsDir, f)).isDirectory());

  console.log(`Syncing ${directories.length} tools to collection...`);

  for (const slug of directories) {
    const { cat, icon } = categorizeSlug(slug);
    const subcat = subcategorize(slug);
    const name = formatName(slug);
    const type = determineType(slug);
    
    const envKey = `VITE_APPWRITE_FUNCTION_${slug.toUpperCase().replace(/-/g, '_')}_ID`;
    const functionId = process.env[envKey] || slug;

    const payload = {
      slug,
      name,
      category: cat,
      subcategory: subcat,
      description: `High-quality ${name} tool running securely on Qofeno servers.`,
      is_free: type === 'Free',
      is_new: true,
      function_id: functionId,
      icon: icon,
      tags: slug.split('-'),
      updated_at: new Date().toISOString()
    };

    try {
      // Try updating
      await request('PATCH', `/databases/${dbId}/collections/tools/documents/${slug}`, { data: payload });
      console.log(`✅ Synced (Updated): ${slug}`);
    } catch (err) {
      // If document doesn't exist, create it
      try {
        await request('POST', `/databases/${dbId}/collections/tools/documents`, { documentId: slug, data: { ...payload, created_at: new Date().toISOString() } });
        console.log(`✅ Synced (Created): ${slug}`);
      } catch (postErr) {
        console.error(`❌ Failed to sync: ${slug} - ${postErr.message}`);
      }
    }
  }

  console.log("Database tools collection sync complete!");
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
