import { Client, Databases } from "node-appwrite";
import dotenv from "dotenv";
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);

async function main() {
  try {
    const list = await db.listDocuments(process.env.DATABASE_ID || 'qofeno_db', 'tools');
    const categories = new Set();
    for (const doc of list.documents) {
      categories.add(doc.category);
    }
    console.log("Categories found in DB:", Array.from(categories));
  } catch (err) {
    console.error(err.message);
  }
}

main();
