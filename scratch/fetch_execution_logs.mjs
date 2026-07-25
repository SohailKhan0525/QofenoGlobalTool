import dotenv from 'dotenv';
dotenv.config();

const endpoint = (process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1').replace(/\/$/, '');
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

const headers = {
  'X-Appwrite-Project': projectId,
  'X-Appwrite-Key': apiKey,
  'Content-Type': 'application/json'
};

const TOOL_FUNCTION_IDS = [
  'qofeno-pdf', 'qofeno-image', 'qofeno-video', 
  'qofeno-audio', 'qofeno-text', 'qofeno-developer', 
  'qofeno-data', 'qofeno-security'
];

async function fetchRecentExecutionLogs() {
  console.log("\n=== FETCHING RECENT EXECUTION LOGS FROM APPWRITE CLOUD ===\n");

  for (const fnId of TOOL_FUNCTION_IDS) {
    const r = await fetch(`${endpoint}/functions/${fnId}/executions?queries[]=orderDesc(%24createdAt)&queries[]=limit(3)`, { headers });
    const data = await r.json();
    const execs = data.executions || [];

    if (execs.length === 0) {
      console.log(`[${fnId}] No recent executions found.`);
      continue;
    }

    console.log(`\n========== ${fnId} ==========`);
    for (const ex of execs) {
      const age = Math.round((Date.now() - new Date(ex.$createdAt).getTime()) / 60000);
      console.log(`  Execution: ${ex.$id} | Status: ${ex.status} | ${age}m ago | Duration: ${ex.duration}s`);
      if (ex.errors && ex.errors.trim()) {
        console.log(`  ❌ ERRORS:\n${ex.errors.split('\n').map(l => '    ' + l).join('\n')}`);
      }
      if (ex.logs && ex.logs.trim()) {
        // Show last 15 lines of logs
        const logLines = ex.logs.trim().split('\n');
        const lastLines = logLines.slice(-15);
        console.log(`  📋 LOGS (last 15 lines):\n${lastLines.map(l => '    ' + l).join('\n')}`);
      }
      if (ex.responseBody && ex.responseBody.trim()) {
        try {
          const parsed = JSON.parse(ex.responseBody);
          console.log(`  📤 RESPONSE: ${JSON.stringify(parsed).substring(0, 300)}`);
        } catch {
          console.log(`  📤 RESPONSE: ${ex.responseBody.substring(0, 300)}`);
        }
      }
      console.log('  ---');
    }
  }
}

fetchRecentExecutionLogs();
