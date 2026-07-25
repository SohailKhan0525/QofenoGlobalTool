import { Client, Functions } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID); // NO API KEY (guest client)

const functions = new Functions(client);

async function test() {
  console.log("1. Testing synchronous createExecution on qofeno-pdf...");
  try {
    const res = await functions.createExecution('qofeno-pdf', JSON.stringify({ tool: 'pdf-merge' }), false);
    console.log("Sync response status:", res.status, "body length:", (res.responseBody || '').length);
  } catch (e) {
    console.log("Sync error:", e.message, "code:", e.code);
  }

  console.log("\n2. Testing asynchronous createExecution on qofeno-pdf...");
  try {
    const ex = await functions.createExecution('qofeno-pdf', JSON.stringify({ tool: 'pdf-merge' }), true);
    console.log("Async created execution ID:", ex.$id, "status:", ex.status);
    const getRes = await functions.getExecution('qofeno-pdf', ex.$id);
    console.log("getExecution result status:", getRes.status);
  } catch (e) {
    console.log("Async error:", e.message, "code:", e.code);
  }
}

test();
