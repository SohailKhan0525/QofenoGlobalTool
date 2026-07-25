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
  console.log("\n=== APPWRITE FUNCTION STATUS ===\n");
  for (const fnId of FUNCTIONS) {
    const r = await fetch(`${endpoint}/functions/${fnId}`, { headers });
    const fn = await r.json();
    console.log(`${fnId}: deployment=${fn.deployment || 'none'} | latestDeployment=${fn.latestDeploymentId || fn.latestDeployment || 'none'}`);
    
    // Try all deployments with no filter
    const r2 = await fetch(`${endpoint}/functions/${fnId}/deployments`, { headers });
    const d2 = await r2.json();
    const deps = d2.deployments || d2.documents || [];
    if (deps.length > 0) {
      for (const d of deps.slice(0, 2)) {
        console.log(`  dep: [${d.status}] ${d.$id} created=${d.$createdAt} type=${d.type}`);
      }
    } else {
      console.log(`  No deployments. Raw response keys: ${Object.keys(d2).join(', ')}`);
    }
  }
}

checkStatus();
