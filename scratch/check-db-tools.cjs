const { Client, Databases } = require('node-appwrite');
require('dotenv').config();
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const db = new Databases(client);

async function check() {
  const res = await db.listDocuments(process.env.DATABASE_ID || 'qofeno_db', 'tools', []);
  const cats = new Set();
  res.documents.forEach(d => {
    cats.add(d.category);
    console.log(`Tool: ${d.name} | Category: ${d.category} | is_free: ${d.is_free}`);
  });
  console.log('Categories found:', Array.from(cats));
}
check().catch(console.error);
