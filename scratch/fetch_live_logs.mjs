import { Client, Functions } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
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

async function fetchLiveLogs() {
  console.log("\n================ LIVE APPWRITE FUNCTION LOGS ================\n");

  for (const fnId of functions) {
    try {
      const execs = await funcs.listExecutions(fnId);
      if (execs.executions.length > 0) {
        console.log(`\n--- ${fnId.toUpperCase()} (Latest 3 Executions) ---`);
        for (const exec of execs.executions.slice(0, 3)) {
          console.log(`  ID: ${exec.$id}`);
          console.log(`  Status: ${exec.status} | Code: ${exec.responseStatusCode} | Duration: ${exec.duration}s`);
          console.log(`  Created: ${exec.$createdAt}`);
          if (exec.requestPayload) console.log(`  Payload: ${exec.requestPayload}`);
          if (exec.errors) console.log(`  ⚠️ ERROR: ${exec.errors}`);
          if (exec.responseBody) console.log(`  Output: ${exec.responseBody.slice(0, 200)}`);
          console.log(`  -----------------------------------------`);
        }
      }
    } catch (e) {
      console.log(`Error checking ${fnId}: ${e.message}`);
    }
  }
}

fetchLiveLogs();
