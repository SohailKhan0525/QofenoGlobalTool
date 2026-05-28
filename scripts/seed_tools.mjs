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
  const envPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!envPath) throw new Error('Unable to find .env.server');

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

const tools = [
  { slug: 'json-formatter', name: 'JSON Parser & Formatter', category: 'Developer Tools', subcategory: 'Parsers', description: 'Format, validate, and beautify your JSON data directly in your browser. No data leaves your machine.', is_free: true, is_new: true, function_id: '2217055e890645a5af054eb1d6186efe', tags: ['json', 'formatter', 'developer'] },
  { slug: 'base64-encoder', name: 'Base64 Native Encoder', category: 'Developer Tools', subcategory: 'Encoders', description: 'Securely encode or decode text and strings into Base64 format locally.', is_free: true, is_new: false, function_id: 'e63948affa5e460085fc9fc8b2a14dde', tags: ['base64', 'encode', 'decode'] },
  { slug: 'word-counter', name: 'Text Word & Character Counter', category: 'AI & Automation', subcategory: 'Text AI', description: 'Instantly count words, characters, and reading time for any block of text.', is_free: true, is_new: false, function_id: '4291a710a39643dca3c0f28615496583', tags: ['text', 'count', 'words'] },
  { slug: 'text-case-converter', name: 'Text Case Converter', category: 'Developer Tools', subcategory: 'Text Utilities', description: 'Convert text between lower, upper, title, camel, snake, kebab, and pascal case instantly.', is_free: true, is_new: false, function_id: '8be86de4f76b44d59fbfba912b749482', tags: ['text', 'case', 'converter'] },
  { slug: 'pdf-compressor', name: 'PDF Compressor', category: 'PDF & Documents', subcategory: 'Compressors', description: 'Compress PDF files while keeping pages readable and delivery-friendly.', is_free: true, is_new: true, function_id: '8e0d74d220b841bab88e1eab430a48a4', tags: ['pdf', 'compress', 'documents'] },
  { slug: 'pdf-merger', name: 'PDF Merger', category: 'PDF & Documents', subcategory: 'Combiners', description: 'Combine multiple PDF files into one clean document.', is_free: true, is_new: false, function_id: '5b901944578b4f55b49f0a3a5bf92ce5', tags: ['pdf', 'merge', 'documents'] },
  { slug: 'pdf-splitter', name: 'PDF Splitter', category: 'PDF & Documents', subcategory: 'Separators', description: 'Split a PDF into individual pages or custom page ranges.', is_free: true, is_new: false, function_id: '6d6e586a3b104a5bba400a8c6fddb020', tags: ['pdf', 'split', 'documents'] },
  { slug: 'pdf-to-word', name: 'PDF to Word', category: 'PDF & Documents', subcategory: 'Converters', description: 'Extract text from PDFs and convert it into a Word document.', is_free: true, is_new: false, function_id: 'a6ef63d22525488890fcc6bfb2ea9b55', tags: ['pdf', 'word', 'convert'] },
  { slug: 'image-resizer', name: 'Image Resizer', category: 'Image Tools', subcategory: 'Resizers', description: 'Resize images to specific dimensions and output formats.', is_free: true, is_new: false, function_id: '893ee730c40c45b8b65b4bf3129d2dea', tags: ['image', 'resize', 'compress'] },
  { slug: 'image-compressor', name: 'Image Compressor', category: 'Image Tools', subcategory: 'Compressors', description: 'Reduce image file size with quality controls and modern formats.', is_free: true, is_new: false, function_id: 'ac2703f31bc2480b94014fe17ae69ff0', tags: ['image', 'compress', 'optimize'] },
  { slug: 'image-converter', name: 'Image Converter', category: 'Image Tools', subcategory: 'Converters', description: 'Convert images between PNG, JPG, WEBP, AVIF, GIF, and TIFF.', is_free: true, is_new: false, function_id: 'e82741d4b61642c290ccb95909d2b1b4', tags: ['image', 'convert', 'formats'] },
  { slug: 'image-bg-remover', name: 'Image Background Remover', category: 'Image Tools', subcategory: 'Enhancers', description: 'Remove simple backgrounds from images and export transparent PNGs.', is_free: true, is_new: true, function_id: '9e1ae1632aeb4ce789399df3c236b24f', tags: ['image', 'background', 'remove'] },
  { slug: 'video-compressor', name: 'Video Compressor', category: 'Video Tools', subcategory: 'Compressors', description: 'Compress videos for faster uploads and smaller sharing sizes.', is_free: true, is_new: true, function_id: '9b6795e4c10643ba80954c6c6cc65f32', tags: ['video', 'compress', 'mp4'] },
  { slug: 'video-trimmer', name: 'Video Trimmer', category: 'Video Tools', subcategory: 'Editors', description: 'Trim video clips to the exact start and end points you need.', is_free: true, is_new: false, function_id: '94b5e417d36a4c5284618d8f70bd644b', tags: ['video', 'trim', 'edit'] },
];

async function upsertTool(dbId, tool) {
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
    await request('GET', `/databases/${dbId}/collections/tools/documents/${tool.slug}`);
    await request('PUT', `/databases/${dbId}/collections/tools/documents/${tool.slug}`, { data: payload });
    console.log(`Updated ${tool.slug}`);
  } catch (error) {
    if (Number(error?.status) !== 404) throw error;
    await request('POST', `/databases/${dbId}/collections/tools/documents`, { documentId: tool.slug, data: payload });
    console.log(`Created ${tool.slug}`);
  }
}

async function main() {
  const envPath = loadEnv();
  console.log(`Loaded env: ${envPath}`);
  assertEnv('APPWRITE_ENDPOINT');
  assertEnv('APPWRITE_PROJECT_ID');
  assertEnv('APPWRITE_API_KEY');

  const dbId = process.env.DATABASE_ID || 'qofeno_db';
  for (const tool of tools) {
    await upsertTool(dbId, tool);
  }
  console.log('Tools seeding finished.');
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});