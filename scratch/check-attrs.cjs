const { Client, Databases } = require('node-appwrite');
require('dotenv').config();
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const db = new Databases(client);

async function check() {
  const res = await db.listDocuments(process.env.DATABASE_ID || 'qofeno_db', 'tools', []);
  if (res.documents.length > 0) {
    console.log('Document Attributes:', Object.keys(res.documents[0]));
    console.log('Sample Document:', res.documents[0]);
  } else {
    console.log('No documents found in tools collection.');
  }
}
check().catch(console.error);
