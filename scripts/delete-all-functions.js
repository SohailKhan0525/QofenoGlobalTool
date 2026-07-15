import { Client, Functions, Query } from "node-appwrite"
import dotenv from "dotenv"
dotenv.config()

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)

const functions = new Functions(client)

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runWithRetry(fn, maxRetries = 5, delay = 3000) {
  let lastErr;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      console.warn(`[WARN] Action failed. Retrying in ${delay / 1000}s... (${err.message})`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

async function deleteAll() {
  console.log("Fetching all function IDs to delete...")
  const allIds = [];
  let offset = 0;

  while (true) {
    let list;
    try {
      list = await runWithRetry(() => functions.list([Query.limit(100), Query.offset(offset)]));
    } catch (err) {
      console.error(`[ERROR] Failed to list functions: ${err.message}`);
      break;
    }

    if (!list || list.functions.length === 0) break;
    
    for (const fn of list.functions) {
      allIds.push({ id: fn.$id, name: fn.name });
    }

    offset += 100;
    if (list.functions.length < 100) break;
  }

  console.log(`Found ${allIds.length} functions to delete. Starting deletion...`);

  let total = 0;
  for (const fn of allIds) {
    try {
      await runWithRetry(() => functions.delete(fn.id));
      console.log(`✓ Deleted: ${fn.name} (${fn.id})`);
      total++;
    } catch (err) {
      console.error(`[ERROR] Failed to delete ${fn.name} (${fn.id}): ${err.message}`);
    }
    await sleep(250); // Cooldown to avoid rate limits
  }

  console.log(`\n✓ Deleted ${total} functions total.`);
}

deleteAll().catch(console.error)
