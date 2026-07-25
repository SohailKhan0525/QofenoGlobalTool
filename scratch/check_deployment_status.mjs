import dotenv from 'dotenv';
dotenv.config();

const endpoint = (process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1').replace(/\/$/, '');
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const headers = { 'X-Appwrite-Project': projectId, 'X-Appwrite-Key': apiKey };

const FUNCTIONS = [
  'qofeno-pdf', 'qofeno-image', 'qofeno-video', 'qofeno-audio',
  'qofeno-text', 'qofeno-developer', 'qofeno-data', 'qofeno-security'
];

async function checkStatus() {
  console.log("\n=== APPWRITE FUNCTION DEPLOYMENT STATUS ===\n");
  for (const fnId of FUNCTIONS) {
    const r = await fetch(`${endpoint}/functions/${fnId}/deployments?queries[]=orderDesc(%24createdAt)&queries[]=limit(3)`, { headers });
    const data = await r.json();
    const deps = data.deployments || [];
    console.log(`${fnId}:`);
    for (const d of deps) {
      const age = Math.round((Date.now() - new Date(d.$createdAt).getTime()) / 60000);
      console.log(`  [${d.status}] id=${d.$id} | ${age}m ago | type=${d.type} | active=${d.activate}`);
    }
    if (deps.length === 0) console.log('  No deployments found');
  }
}

checkStatus();
