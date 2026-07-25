// scripts/activate-all-functions.js
import { Client, Functions } from "node-appwrite"
import dotenv from "dotenv"
dotenv.config()

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)

const funcs = new Functions(client)

async function activateAll() {
  const list = await funcs.list()
  console.log("\n=== ACTIVATING ALL FUNCTIONS ===\n")

  for (const fn of list.functions) {
    const fnId = fn.$id;
    const fnName = fn.name || fnId;

    let deployments = { deployments: [] };
    try {
      deployments = await funcs.listDeployments(fnId)
    } catch (e) {
      console.log(`⚠️ ${fnName}: Could not list deployments: ${e.message}`)
      continue
    }

    const successful = deployments.deployments
      .filter(d => d.status === "ready")
      .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))[0]

    if (!successful) {
      console.log(`❌ ${fnName}: No successful deployment found — needs redeploy`)
      continue
    }

    const currentDeploy = fn.deploymentId || fn.deployment || fn.latestDeploymentId;
    if (currentDeploy === successful.$id && fn.enabled) {
      console.log(`✅ ${fnName}: Active and ready (${successful.$id})`)
      continue
    }

    // Activate the latest successful deployment via updateFunctionDeployment
    try {
      if (typeof funcs.updateFunctionDeployment === 'function') {
        await funcs.updateFunctionDeployment(fnId, successful.$id)
      } else if (typeof funcs.updateDeployment === 'function') {
        await funcs.updateDeployment(fnId, successful.$id)
      }
      console.log(`✓ ${fnName}: Activated deployment ${successful.$id}`)
    } catch (e) {
      console.log(`❌ ${fnName}: Failed to activate deployment: ${e.message}`)
    }
  }
}

activateAll().catch(console.error)
