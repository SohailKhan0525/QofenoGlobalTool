import { Client, Databases, ID, Query } from 'node-appwrite';
import { FALLBACK_TOOLS } from '../src/lib/toolCatalog';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.DATABASE_ID;

if (!endpoint || !projectId || !apiKey || !databaseId) {
  console.error("Missing Appwrite credentials in environment");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

async function run() {
  console.log(`Starting seeding of ${FALLBACK_TOOLS.length} tools...`);
  let created = 0;
  let updated = 0;

  for (const tool of FALLBACK_TOOLS) {
    const payload = {
      slug: tool.slug,
      name: tool.name,
      description: tool.desc,
      category: tool.category,
      subcategory: tool.subcategory,
      is_free: tool.type === 'Free',
      is_new: Boolean(tool.isNew),
      function_id: tool.functionId || '',
      icon: tool.imageUrl || '',
      tags: tool.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      // Check if it exists
      const existing = await databases.listDocuments(databaseId!, 'tools', [
        Query.equal("slug", tool.slug)
      ]);

      if (existing.total > 0) {
        await databases.updateDocument(databaseId!, 'tools', existing.documents[0].$id, payload);
        updated++;
        console.log(`Updated: ${tool.name}`);
      } else {
        await databases.createDocument(databaseId!, 'tools', ID.unique(), payload);
        created++;
        console.log(`Created: ${tool.name}`);
      }
    } catch (err: any) {
      console.error(`Failed to process ${tool.name}:`, err?.message);
    }
  }

  console.log(`\nSeed Complete! Created: ${created}, Updated: ${updated}`);
}

run().catch(console.error);
