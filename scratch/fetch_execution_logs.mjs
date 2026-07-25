import { Client, Functions } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const funcs = new Functions(client);

const functions = [
  'qofeno-pdf',
  'qofeno-image',
  'qofeno-video',
  'qofeno-audio',
  'qofeno-text',
  'qofeno-developer',
  'qofeno-data',
  'qofeno-security'
];

async function fetchRecentLogs() {
  console.log("\n=== FETCHING RECENT FUNCTION EXECUTION ERRORS ===\n");

  for (const fnId of functions) {
    try {
      const executions = await funcs.listExecutions(fnId);
      const failedOrRecent = executions.executions.slice(0, 5);

      if (failedOrRecent.length > 0) {
        console.log(`--- Function: ${fnId} (Total Executions: ${executions.total}) ---`);
        for (const exec of failedOrRecent) {
          console.log(`  ID: ${exec.$id} | Status: ${exec.status} | Code: ${exec.responseStatusCode} | Duration: ${exec.duration}s`);
          if (exec.errors) {
            console.log(`    ⚠️ ERROR LOG: ${exec.errors}`);
          }
          if (exec.responseBody && exec.responseBody.includes('false')) {
            console.log(`    ⚠️ RESPONSE BODY: ${exec.responseBody}`);
          }
        }
      }
    } catch (e) {
      console.log(`Error checking ${fnId}:`, e.message);
    }
  }
}

fetchRecentLogs();
