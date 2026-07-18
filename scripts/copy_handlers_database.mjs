import fs from 'fs';
import path from 'path';
import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';

// Load env
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);
const dbId = process.env.DATABASE_ID || 'qofeno_db';

const CATEGORY_TO_FUNCTION = {
  'PDF & Documents': 'qofeno-pdf',
  'Image Tools': 'qofeno-image',
  'Video Tools': 'qofeno-video',
  'Audio Tools': 'qofeno-audio',
  'Text Tools': 'qofeno-text',
  'Text & Writing': 'qofeno-text',
  'Developer Tools': 'qofeno-developer',
  'Data Tools': 'qofeno-data',
  'Security & Privacy': 'qofeno-security',
  'Security Tools': 'qofeno-security'
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runWithRetry(fn, maxRetries = 5, delay = 5000) {
  let lastErr;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      console.warn(`[WARN] Action failed. Retrying in ${delay / 1000}s... (${err.message})`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

async function main() {
  console.log("Fetching all tools from database to map categories...");
  const slugToCategory = {};
  let offset = 0;

  while (true) {
    let list;
    try {
      list = await runWithRetry(() => db.listDocuments(dbId, 'tools', [
        Query.limit(100),
        Query.offset(offset)
      ]));
    } catch (err) {
      console.error(`[FATAL] Failed to retrieve tools: ${err.message}`);
      break;
    }

    if (list.documents.length === 0) break;

    for (const doc of list.documents) {
      slugToCategory[doc.slug] = doc.category;
    }

    offset += 100;
    if (list.documents.length < 100) break;
  }

  const totalMapped = Object.keys(slugToCategory).length;
  console.log(`Mapped ${totalMapped} tools from database.`);

  const functionsRoot = path.resolve('functions');
  const toolsDir = path.resolve('appwrite-functions', 'tools');

  if (!fs.existsSync(toolsDir)) {
    throw new Error(`Tools directory not found: ${toolsDir}`);
  }

  // 1. Clean out all existing files in functions/qofeno-*/src/handlers/
  const categories = Object.values(CATEGORY_TO_FUNCTION);
  const uniqueCategories = [...new Set(categories)];

  for (const cat of uniqueCategories) {
    const handlerDir = path.join(functionsRoot, cat, 'src', 'handlers');
    if (fs.existsSync(handlerDir)) {
      const files = fs.readdirSync(handlerDir);
      for (const f of files) {
        fs.unlinkSync(path.join(handlerDir, f));
      }
      console.log(`🧹 Cleaned: ${cat}/src/handlers/`);
    }
  }

  // 2. Loop through tools directory and copy to correct folder
  const tools = fs.readdirSync(toolsDir).filter(f => fs.statSync(path.join(toolsDir, f)).isDirectory());
  let copiedCount = 0;
  const counts = {};

  for (const slug of tools) {
    const srcFile = path.join(toolsDir, slug, 'src', 'main.js');
    if (!fs.existsSync(srcFile)) continue;

    // Check env override first
    const envKey = `VITE_APPWRITE_FUNCTION_${slug.toUpperCase().replace(/-/g, '_')}_ID`;
    let cat = process.env[envKey];

    if (cat && cat !== 'none' && uniqueCategories.includes(cat)) {
      // Valid category/function ID from env override
    } else {
      const dbCategory = slugToCategory[slug];
      cat = CATEGORY_TO_FUNCTION[dbCategory];

      if (!cat) {
        // Fallback matching if not in database
        if (slug.includes('pdf')) cat = 'qofeno-pdf';
        else if (slug.includes('image')) cat = 'qofeno-image';
        else if (slug.includes('video')) cat = 'qofeno-video';
        else if (slug.includes('audio')) cat = 'qofeno-audio';
        else if (slug.includes('text') || slug.includes('case')) cat = 'qofeno-text';
        else if (slug.includes('json') || slug.includes('base64')) cat = 'qofeno-developer';
        else if (slug.includes('csv') || slug.includes('data')) cat = 'qofeno-data';
        else cat = 'qofeno-security';
      }
    }

    const destDir = path.join(functionsRoot, cat, 'src', 'handlers');
    const destFile = path.join(destDir, `${slug}.js`);

    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(srcFile, destFile);

    counts[cat] = (counts[cat] || 0) + 1;
    copiedCount++;
  }

  console.log('\n--- Copy Summary ---');
  for (const [cat, count] of Object.entries(counts)) {
    console.log(`- ${cat}: ${count} files`);
  }
  console.log(`Total copied: ${copiedCount} files.`);
}

main().catch(console.error);
