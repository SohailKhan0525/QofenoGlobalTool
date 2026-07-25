import { Client, Functions } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID); // guest client (no API key)

const functions = new Functions(client);

async function testSync() {
  console.log("Testing sync execution for word-counter on qofeno-developer/text...");
  try {
    const res = await functions.createExecution(
      'qofeno-developer',
      JSON.stringify({ tool: 'json-formatter', json: '{"hello":"world"}', action: 'format' }),
      false // SYNC EXECUTION
    );
    console.log("Sync response status:", res.status);
    console.log("Sync response body:", res.responseBody);
  } catch (e) {
    console.log("Sync failed:", e.message);
  }
}

testSync();
