// scripts/audit-functions.js
import { Client, Functions, Databases, Query } from "node-appwrite"
import dotenv from "dotenv"
dotenv.config()

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)

const funcs = new Functions(client)
const db = new Databases(client)

async function audit() {
  // 1. List all functions and their deployment status
  const list = await funcs.list()
  console.log("\n=== APPWRITE FUNCTIONS STATUS ===\n")
  for (const fn of list.functions) {
    let deployments = { deployments: [] };
    try {
      deployments = await funcs.listDeployments(fn.$id)
    } catch (e) {
      // Ignore if no deployments list permission or empty
    }
    
    const activeDeployId = fn.deploymentId || fn.deployment || fn.latestDeploymentId;
    const active = deployments.deployments.find(d => d.$id === activeDeployId)
    const statusStr = fn.status || (fn.enabled ? "enabled" : "disabled")
    const activeDeployStatus = active ? active.status : (fn.latestDeploymentStatus || "NONE")
    
    console.log(
      `${(fn.name || fn.$id).padEnd(35)} | ` +
      `ID: ${fn.$id.padEnd(20)} | ` +
      `Status: ${statusStr.padEnd(10)} | ` +
      `Active deploy: ${activeDeployStatus === "ready" ? "✅ ready" : "❌ " + activeDeployStatus} | ` +
      `Runtime: ${fn.runtime}`
    )
  }

  // 2. List all tools and check their function_id is deployed
  const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID || "qofeno_db"
  let tools;
  try {
    tools = await db.listDocuments(databaseId, "tools", [
      Query.equal("is_active", true),
      Query.equal("is_coming_soon", false),
      Query.limit(200)
    ])
  } catch (err) {
    console.log(`Could not fetch tools collection from ${databaseId}:`, err.message)
    tools = { documents: [], total: 0 }
  }

  console.log("\n=== TOOL → FUNCTION MAPPING ===\n")
  const functionIds = list.functions.map(f => f.$id)
  for (const tool of tools.documents) {
    const ok = functionIds.includes(tool.function_id)
    console.log(
      `${tool.slug.padEnd(40)} → ${(tool.function_id || "N/A").padEnd(20)} ${ok ? "✅" : "❌ FUNCTION MISSING"}`
    )
  }

  console.log(`\nTotal functions: ${list.functions.length}`)
  console.log(`Total active tools: ${tools.total}`)
}

audit().catch(console.error)
