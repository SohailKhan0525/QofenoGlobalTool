// scripts/sync-all-tools-from-db.mjs
import fs from 'fs';
import path from 'path';
import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const endpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const dbId = process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID || 'qofeno_db';

if (!projectId || !apiKey) {
  console.error("Missing APPWRITE_PROJECT_ID or APPWRITE_API_KEY in .env");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const db = new Databases(client);

function categorizeSlug(slug) {
  if (slug.includes('pdf') || slug.includes('word') || slug.includes('excel') || slug.includes('powerpoint') || slug.includes('doc') || slug.includes('ppt') || slug.includes('txt') || slug.includes('rtf') || slug.includes('epub')) return { cat: 'PDF & Documents', icon: 'faFileLines' };
  if (slug.includes('video') || slug.match(/(mp4|mov|avi|webm|mkv|flv|wmv|3gp|gif-to-video)/)) return { cat: 'Video Tools', icon: 'faVideo' };
  if (slug.includes('image') || slug.match(/(jpg|png|webp|avif|heic|bmp|tiff|svg|ico|raw|psd|resize|crop|compress-image|converter-image|watermark|bg-remove)/)) return { cat: 'Image Tools', icon: 'faImageIcon' };
  if (slug.includes('audio') || slug.match(/(mp3|wav|ogg|flac|aac|opus|wma|aiff|amr|volume|pitch|bass|silence|fade|ringtone|audio)/)) return { cat: 'Audio Tools', icon: 'faMusic' };
  if (slug.includes('json') || slug.includes('base64') || slug.includes('xml') || slug.includes('yaml') || slug.includes('sql') || slug.includes('formatter') || slug.includes('minifier') || slug.includes('jwt') || slug.includes('uuid') || slug.includes('hash')) return { cat: 'Developer Tools', icon: 'faCode' };
  if (slug.includes('csv') || slug.includes('data') || slug.includes('chart') || slug.includes('table') || slug.includes('math')) return { cat: 'Data & Analytics', icon: 'faChartLine' };
  if (slug.includes('qr') || slug.includes('barcode') || slug.includes('password') || slug.includes('encrypt') || slug.includes('decrypt') || slug.includes('security')) return { cat: 'Security & Web', icon: 'faShieldHalved' };
  return { cat: 'AI & Utilities', icon: 'faRobot' };
}

function subcategorize(slug) {
  if (slug.includes('compress') || slug.includes('optimize') || slug.includes('reduce')) return 'Compressors';
  if (slug.includes('convert') || slug.includes('to')) return 'Converters';
  if (slug.includes('merge') || slug.includes('combine') || slug.includes('join')) return 'Combiners';
  if (slug.includes('split') || slug.includes('extract') || slug.includes('remove')) return 'Separators';
  if (slug.includes('edit') || slug.includes('rotate') || slug.includes('watermark') || slug.includes('header')) return 'Editors';
  if (slug.includes('resize') || slug.includes('crop') || slug.includes('trim') || slug.includes('scale')) return 'Resizers';
  return 'Utilities';
}

function formatName(slug) {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/\bPdf\b/g, 'PDF')
    .replace(/\bJpg\b/g, 'JPG')
    .replace(/\bPng\b/g, 'PNG')
    .replace(/\bWebp\b/g, 'WebP')
    .replace(/\bAvif\b/g, 'AVIF')
    .replace(/\bHtml\b/g, 'HTML')
    .replace(/\bJson\b/g, 'JSON')
    .replace(/\bXml\b/g, 'XML')
    .replace(/\bCsv\b/g, 'CSV')
    .replace(/\bOcr\b/g, 'OCR')
    .replace(/\bQr\b/g, 'QR')
    .replace(/\bMp3\b/g, 'MP3')
    .replace(/\bMp4\b/g, 'MP4')
    .replace(/\bWav\b/g, 'WAV')
    .replace(/\bBg\b/g, 'Background');
}

async function syncAllTools() {
  console.log("Fetching all tools from Appwrite database...");
  let allTools = [];
  let offset = 0;
  while (true) {
    const res = await db.listDocuments(dbId, 'tools', [Query.limit(100), Query.offset(offset)]);
    allTools.push(...res.documents);
    if (allTools.length >= res.total) break;
    offset += 100;
  }

  console.log(`Retrieved ${allTools.length} tools from Appwrite database!`);

  // Build FALLBACK_TOOLS TS array string
  let toolsArrayStr = `export const FALLBACK_TOOLS: ToolCard[] = [\n`;

  for (const toolDoc of allTools) {
    const slug = toolDoc.slug || toolDoc.$id;
    const name = toolDoc.name || formatName(slug);
    const { cat, icon } = categorizeSlug(slug);
    const category = toolDoc.category || cat;
    const subcategory = toolDoc.subcategory || subcategorize(slug);
    const isFree = toolDoc.is_free !== false;
    const type = isFree ? 'Free' : 'Pro';
    const desc = (toolDoc.description || `High-quality ${name} tool running directly in your browser or securely on Qofeno servers.`).replace(/'/g, "\\'");
    const functionId = toolDoc.function_id || 'qofeno-pdf';

    toolsArrayStr += `  {
    id: '${slug}',
    slug: '${slug}',
    name: '${name.replace(/'/g, "\\'")}',
    category: '${category.replace(/'/g, "\\'")}',
    subcategory: '${subcategory.replace(/'/g, "\\'")}',
    type: '${type}',
    isNew: ${Boolean(toolDoc.is_new)},
    isPopular: ${Boolean(toolDoc.is_popular)},
    runs: '${toolDoc.runs || '0'}',
    desc: '${desc}',
    icon: ${icon},
    imageUrl: ${toolDoc.icon && /^https?:\/\//i.test(toolDoc.icon) ? `'${toolDoc.icon}'` : 'null'},
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: '${name.replace(/'/g, "\\'")}',
      applicationCategory: '${category.replace(/'/g, "\\'")}',
      operatingSystem: 'Web',
      description: '${desc}',
    }),
    functionId: '${functionId}',
  },\n`;
  }

  toolsArrayStr += `];`;

  const toolCatalogPath = path.join(process.cwd(), 'src', 'lib', 'toolCatalog.ts');
  let catalogContent = fs.readFileSync(toolCatalogPath, 'utf8');

  const regex = /export const FALLBACK_TOOLS: ToolCard\[\] = \[[\s\S]*?\];/;
  if (regex.test(catalogContent)) {
    catalogContent = catalogContent.replace(regex, toolsArrayStr);
    fs.writeFileSync(toolCatalogPath, catalogContent);
    console.log(`✅ Successfully synced ALL ${allTools.length} tools into src/lib/toolCatalog.ts!`);
  } else {
    console.error("❌ Could not find FALLBACK_TOOLS array in src/lib/toolCatalog.ts");
  }
}

syncAllTools().catch(console.error);
