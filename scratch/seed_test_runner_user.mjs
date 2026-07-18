import { Client, Databases, Query, ID } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);
const dbId = process.env.DATABASE_ID || 'qofeno_db';

async function main() {
  const userId = 'test-runner';
  console.log(`Checking if user ${userId} exists in users_meta...`);
  
  const existing = await db.listDocuments(dbId, 'users_meta', [
    Query.equal('user_id', userId),
    Query.limit(1)
  ]);

  const payload = {
    user_id: userId,
    plan: 'teams'
  };

  if (existing.total > 0) {
    const docId = existing.documents[0].$id;
    await db.updateDocument(dbId, 'users_meta', docId, payload);
    console.log(`✓ Updated test-runner user to teams plan.`);
  } else {
    await db.createDocument(dbId, 'users_meta', ID.unique(), payload);
    console.log(`✓ Created test-runner user with teams plan.`);
  }
}

main().catch(console.error);
