import { Client, Functions } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const funcs = new Functions(client);

async function activateLatestAll() {
  console.log("\n=== ACTIVATING LATEST DEPLOYMENTS ON ALL FUNCTIONS ===");
  const list = await funcs.list();

  for (const fn of list.functions) {
    const fnId = fn.$id;
    try {
      const deps = await funcs.listDeployments(fnId);
      if (deps.deployments.length > 0) {
        const latest = deps.deployments[0];
        await funcs.updateDeployment(fnId, latest.$id);
        console.log(`✅ Activated latest deployment '${latest.$id}' on function '${fn.name}' (${fnId})`);
      }
    } catch (e) {
      console.log(`❌ Failed to activate ${fn.name}:`, e.message);
    }
  }

  console.log("\nAll functions now running latest Universal Fallback Engine!");
}

activateLatestAll();
