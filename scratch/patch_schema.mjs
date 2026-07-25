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

// Check if output_file_id exists and add it if not; also add category default
async function patchCollectionSchema() {
  const r = await fetch(`${endpoint}/databases/${databaseId}/collections/tool_executions/attributes`, { headers });
  const data = await r.json();
  const attrKeys = (data.attributes || []).map(a => a.key);
  console.log("Existing attributes:", attrKeys.join(', '));

  // Add output_file_id if missing
  if (!attrKeys.includes('output_file_id')) {
    console.log("Adding output_file_id attribute...");
    const addR = await fetch(`${endpoint}/databases/${databaseId}/collections/tool_executions/attributes/string`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ key: 'output_file_id', size: 36, required: false, default: null, array: false })
    });
    const addData = await addR.json();
    console.log("  output_file_id:", addR.status, addData.key || addData.message);
  } else {
    console.log("output_file_id already exists.");
  }
  
  // Make category NOT required (set default to 'General')
  // We can't directly patch required=false on existing attr in Appwrite without deleting and recreating
  // Instead let's check if it's required and note it
  const catAttr = (data.attributes || []).find(a => a.key === 'category');
  if (catAttr && catAttr.required) {
    console.log("\n⚠️  category is REQUIRED with no default — this causes all saveToolExecution() calls in main.js (universal fallback) to fail.");
    console.log("   Fix: All saveToolExecution() calls MUST include 'category' field.");
    console.log("   We need to update main.js across all 8 functions to include category.");
  }
}

patchCollectionSchema();
