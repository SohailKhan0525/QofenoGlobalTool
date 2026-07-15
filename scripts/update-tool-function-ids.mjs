import { Client, Databases, Query } from "node-appwrite";
import dotenv from "dotenv";
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

async function runWithRetry(fn, maxRetries = 20, delay = 15000) {
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
  console.log("Fetching all tools from collection 'tools'...");
  let offset = 0;
  let totalUpdated = 0;

  while (true) {
    let list;
    try {
      list = await runWithRetry(() => db.listDocuments(dbId, 'tools', [
        Query.limit(100),
        Query.offset(offset)
      ]));
    } catch (err) {
      console.error(`[FATAL] Failed to retrieve tools after retries: ${err.message}`);
      break;
    }

    if (list.documents.length === 0) break;

    for (const doc of list.documents) {
      const slug = doc.slug || doc.$id;
      const category = doc.category;
      
      // Determine function ID based on category
      let functionId = CATEGORY_TO_FUNCTION[category];
      if (!functionId) {
        // Fallback checks
        if (slug.includes('pdf')) functionId = 'qofeno-pdf';
        else if (slug.includes('image')) functionId = 'qofeno-image';
        else if (slug.includes('video')) functionId = 'qofeno-video';
        else if (slug.includes('audio')) functionId = 'qofeno-audio';
        else if (slug.includes('text') || slug.includes('case')) functionId = 'qofeno-text';
        else if (slug.includes('json') || slug.includes('base64')) functionId = 'qofeno-developer';
        else if (slug.includes('csv') || slug.includes('data')) functionId = 'qofeno-data';
        else functionId = 'qofeno-security';
      }

      if (doc.function_id !== functionId) {
        try {
          await runWithRetry(() => db.updateDocument(dbId, 'tools', doc.$id, {
            function_id: functionId
          }));
          console.log(`✓ Updated ${slug}: ${category} -> ${functionId}`);
          totalUpdated++;
        } catch (err) {
          console.error(`[ERROR] Failed to update ${slug}: ${err.message}`);
        }
        await sleep(50);
      }
    }

    offset += 100;
    if (list.documents.length < 100) break;
  }

  console.log(`\nTool database mapping updates finished. Total updated: ${totalUpdated}`);
}

main().catch(console.error);
