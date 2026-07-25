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

// Add output_file_id to tool_executions (already added above)
// Now check and add tool_executions_log collection if needed for real-time progress
async function addProgressLogCollection() {
  // Check if tool_execution_logs exists
  const r = await fetch(`${endpoint}/databases/${databaseId}/collections`, { headers });
  const cols = await r.json();
  const exists = (cols.collections || []).find(c => c.$id === 'tool_execution_logs');
  
  if (exists) {
    console.log("tool_execution_logs collection already exists.");
    return;
  }

  console.log("Creating tool_execution_logs collection for real-time progress...");
  
  // Create collection
  const createR = await fetch(`${endpoint}/databases/${databaseId}/collections`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      collectionId: 'tool_execution_logs',
      name: 'Tool Execution Logs',
      permissions: ['read("any")', 'create("any")', 'update("any")', 'delete("any")'],
      documentSecurity: false
    })
  });
  const col = await createR.json();
  console.log("Collection created:", col.$id || col.message);

  // Add attributes
  const attrs = [
    { type: 'string', key: 'execution_id', size: 36, required: true },
    { type: 'string', key: 'tool_slug', size: 100, required: true },
    { type: 'string', key: 'status', size: 50, required: true }, // queued | processing | uploading | completed | failed
    { type: 'string', key: 'message', size: 500, required: false, default: null },
    { type: 'integer', key: 'progress', required: false, default: 0, min: 0, max: 100 },
    { type: 'string', key: 'download_url', size: 2048, required: false, default: null },
    { type: 'string', key: 'output_filename', size: 500, required: false, default: null },
    { type: 'string', key: 'output_file_id', size: 36, required: false, default: null },
    { type: 'string', key: 'error_message', size: 2000, required: false, default: null },
  ];

  for (const attr of attrs) {
    const url = `${endpoint}/databases/${databaseId}/collections/tool_execution_logs/attributes/${attr.type === 'integer' ? 'integer' : 'string'}`;
    const body = attr.type === 'integer'
      ? { key: attr.key, required: attr.required, default: attr.default ?? null, min: attr.min ?? null, max: attr.max ?? null }
      : { key: attr.key, size: attr.size || 255, required: attr.required, default: attr.default ?? null };
    
    const r2 = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const d2 = await r2.json();
    console.log(`  Added ${attr.key}: ${r2.status === 202 ? '✅' : '❌ ' + JSON.stringify(d2)}`);
    await new Promise(r => setTimeout(r, 200)); // avoid rate limit
  }

  console.log("\n✅ tool_execution_logs collection ready for real-time progress tracking!");
}

addProgressLogCollection();
