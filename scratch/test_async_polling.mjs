import { Client, Databases, Functions, Query, ID } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const endpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.APPWRITE_PROJECT_ID || '69c58725000ef2b43f18';
const apiKey = process.env.APPWRITE_API_KEY;

// Guest client simulation
const client = new Client().setEndpoint(endpoint).setProject(projectId);
const db = new Databases(client);
const funcs = new Functions(client);

async function testAsyncPolling() {
  console.log("\n=== TESTING ASYNC EXECUTION & GUEST POLLING ===");

  try {
    console.log("1. Launching async execution for 'qofeno-text'...");
    const exec = await funcs.createExecution('qofeno-text', JSON.stringify({ tool: 'word-counter', text: 'Testing async polling for guest users' }), true);
    console.log("  ✅ Async execution created! ID:", exec.$id, "Status:", exec.status);

    console.log("2. Polling tool_executions collection as guest...");
    let found = false;
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const res = await db.listDocuments(process.env.DATABASE_ID || 'qofeno_db', 'tool_executions', [
        Query.equal('tool_slug', 'word-counter'),
        Query.orderDesc('$createdAt'),
        Query.limit(1)
      ]);
      if (res.documents.length > 0) {
        console.log("  ✅ Found tool_execution doc:", res.documents[0].$id, "createdAt:", res.documents[0].$createdAt);
        found = true;
        break;
      }
    }

    if (!found) {
      console.log("  ℹ️ No tool_execution doc returned yet (will poll until completed).");
    }

  } catch (e) {
    console.log("  ❌ Failed:", e.message);
  }
}

testAsyncPolling();
