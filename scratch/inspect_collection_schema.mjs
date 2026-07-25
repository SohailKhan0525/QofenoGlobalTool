import dotenv from 'dotenv';
dotenv.config();

const endpoint = (process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1').replace(/\/$/, '');
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.DATABASE_ID || 'qofeno_db';

const headers = {
  'X-Appwrite-Project': projectId,
  'X-Appwrite-Key': apiKey,
  'Content-Type': 'application/json'
};

async function inspectCollection() {
  // Get tool_executions collection attributes
  const r = await fetch(`${endpoint}/databases/${databaseId}/collections/tool_executions/attributes`, { headers });
  const data = await r.json();
  console.log("\n=== tool_executions COLLECTION ATTRIBUTES ===");
  for (const attr of (data.attributes || [])) {
    console.log(`  ${attr.key}: ${attr.type} | required=${attr.required} | default=${JSON.stringify(attr.default)}`);
  }
  
  // Also check the Dockerfile to see how functions are built  
  const r2 = await fetch(`${endpoint}/databases/${databaseId}/collections`, { headers });
  const cols = await r2.json();
  console.log("\n=== ALL COLLECTIONS IN qofeno_db ===");
  for (const col of (cols.collections || [])) {
    console.log(`  ${col.$id}: ${col.name}`);
  }
}

inspectCollection();
