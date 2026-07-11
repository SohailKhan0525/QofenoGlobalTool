import fs from 'fs';
import path from 'path';
import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const db = new Databases(client);
  const databaseId = process.env.DATABASE_ID || 'qofeno_db';

  console.log(`Listing documents in database: ${databaseId}, collection: blog_posts...`);
  const list = await db.listDocuments(databaseId, 'blog_posts');
  console.log(`Total documents found: ${list.total}`);
  for (const doc of list.documents) {
    console.log(`- ${doc.title} (Slug: ${doc.slug}, Published: ${doc.published}, PublishedAt: ${doc.published_at})`);
  }
}

run().catch(console.error);
