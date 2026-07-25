/**
 * activate-latest-ready.mjs
 * For functions where deployment=none, activates the most recent 'ready' deployment
 * while new CLI builds are in progress.
 * Once new builds complete, this script re-runs to activate them.
 */
import dotenv from 'dotenv';
dotenv.config();

const endpoint = (process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1').replace(/\/$/, '');
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const headers = { 'X-Appwrite-Project': projectId, 'X-Appwrite-Key': apiKey, 'Content-Type': 'application/json' };

const FUNCTIONS = [
  'qofeno-pdf', 'qofeno-image', 'qofeno-video', 'qofeno-audio',
  'qofeno-text', 'qofeno-developer', 'qofeno-data', 'qofeno-security'
];

async function activateLatestReady() {
  console.log("\n=== ACTIVATING LATEST READY DEPLOYMENT FOR ALL FUNCTIONS ===\n");
  
  for (const fnId of FUNCTIONS) {
    // Get all deployments
    const r = await fetch(`${endpoint}/functions/${fnId}/deployments`, { headers });
    const data = await r.json();
    const all = data.deployments || [];
    
    // Prefer CLI-type 'ready' deployments (from today's deploy-all-functions.mjs), else fall back to any ready
    const readyDeps = all.filter(d => d.status === 'ready').sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
    const latest = readyDeps[0];
    
    if (!latest) {
      // Check if new CLI build is still processing
      const fnR = await fetch(`${endpoint}/functions/${fnId}`, { headers });
      const fn = await fnR.json();
      console.log(`  ⏳ ${fnId}: No ready deployments yet. Latest deployment ID: ${fn.latestDeploymentId} (still building)`);
      continue;
    }
    
    // Get function details for the PUT body
    const fnR = await fetch(`${endpoint}/functions/${fnId}`, { headers });
    const fn = await fnR.json();
    
    // Activate via update-function-deployment endpoint
    const activateR = await fetch(`${endpoint}/functions/${fnId}/deployments/${latest.$id}`, {
      method: 'PATCH',
      headers,
    });
    const activateData = await activateR.json();
    
    if (activateR.ok) {
      console.log(`  ✅ ${fnId}: Activated deployment ${latest.$id} (created: ${latest.$createdAt.substring(0, 10)})`);
    } else {
      // Try the PUT method  
      const putR = await fetch(`${endpoint}/functions/${fnId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: fn.name,
          runtime: fn.runtime,
          execute: fn.execute || [],
          events: fn.events || [],
          schedule: fn.schedule || '',
          timeout: fn.timeout || 60,
          enabled: fn.enabled !== false,
          logging: fn.logging !== false,
          deployment: latest.$id
        })
      });
      const putData = await putR.json();
      if (putR.ok) {
        console.log(`  ✅ ${fnId}: Activated via PUT. Active: ${putData.deployment}`);
      } else {
        console.log(`  ❌ ${fnId}: Failed to activate. ${JSON.stringify(activateData).substring(0, 150)}`);
      }
    }
  }
  
  console.log('\nDone! Triggering test execution to verify...\n');
  
  // Quick smoke test
  const testR = await fetch(`${endpoint}/functions/qofeno-security/executions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ body: JSON.stringify({ tool: 'password-generator', length: 16 }), async: false })
  });
  const testData = await testR.json();
  console.log(`Smoke test (password-generator): status=${testData.status} | response=${testData.responseBody?.substring(0, 100)}`);
  if (testData.errors) console.log(`  errors: ${testData.errors}`);
  if (testData.logs) console.log(`  logs: ${testData.logs?.substring(0, 200)}`);
}

activateLatestReady();
