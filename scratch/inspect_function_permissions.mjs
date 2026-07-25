import { Client, Functions } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const funcs = new Functions(client);

async function inspectFunctionPermissions() {
  console.log("\n=== INSPECTING APPWRITE FUNCTION EXECUTE PERMISSIONS ===\n");
  const list = await funcs.list();

  for (const fn of list.functions) {
    console.log(`Function: ${fn.name} (${fn.$id})`);
    console.log(`  Execute Permissions:`, fn.execute);
    console.log(`  Status:`, fn.enabled ? 'Enabled' : 'Disabled');
    console.log(`  Active Deployment:`, fn.deployment);
    console.log(`  ----------------------------------`);
  }
}

inspectFunctionPermissions();
