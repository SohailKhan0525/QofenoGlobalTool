import { Client, Functions } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const funcs = new Functions(client);

async function fixActiveDeployments() {
  console.log("\n=== FIXING ACTIVE DEPLOYMENTS ON ALL 17 FUNCTIONS ===\n");
  const list = await funcs.list();

  for (const fn of list.functions) {
    const fnId = fn.$id;
    try {
      const deps = await funcs.listDeployments(fnId);
      const readyDeps = deps.deployments
        .filter(d => d.status === 'ready')
        .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));

      if (readyDeps.length > 0) {
        const latest = readyDeps[0];
        console.log(`Target function: ${fn.name} (${fnId}) -> Latest ready deployment: ${latest.$id}`);

        // Set deployment active using REST endpoint PATCH /v1/functions/{functionId}/deployments/{deploymentId}/active or update
        const ep = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '');
        const resp = await fetch(`${ep}/functions/${fnId}/deployments/${latest.$id}/active`, {
          method: 'PATCH',
          headers: {
            'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID,
            'X-Appwrite-Key': process.env.APPWRITE_API_KEY,
            'Content-Type': 'application/json'
          }
        });

        if (resp.ok) {
          const resData = await resp.json();
          console.log(`  ✅ Successfully activated deployment '${latest.$id}' on ${fn.name}! Active dep in response: ${resData.deployment}`);
        } else {
          const errText = await resp.text();
          console.log(`  ⚠️ REST PATCH activation failed: ${resp.status} - ${errText}`);
        }
      }
    } catch (e) {
      console.log(`  ❌ Error processing ${fn.name}: ${e.message}`);
    }
  }
}

fixActiveDeployments();
