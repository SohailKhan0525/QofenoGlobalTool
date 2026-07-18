import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);

async function main() {
  console.log("Listing documents in users_meta...");
  const result = await db.listDocuments(process.env.DATABASE_ID || 'qofeno_db', 'users_meta');
  console.log(`Found ${result.total} users.`);
  for (const doc of result.documents) {
    console.log(`User ID: ${doc.user_id}, Plan: ${doc.plan}, Email: ${doc.email || 'N/A'}`);
  }
}

main().catch(console.error);
