import { Client, Functions } from "node-appwrite";
import dotenv from "dotenv";
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(process.env.APPWRITE_PROJECT_ID || "69c58725000ef2b43f18")
  .setKey(process.env.APPWRITE_API_KEY);

const functions = new Functions(client);

const azureVars = [
  { key: "AZURE_PROCESSOR_URL",       value: process.env.AZURE_PROCESSOR_URL       || "" },
  { key: "QOFENO_CONTAINER_SECRET",   value: process.env.QOFENO_CONTAINER_SECRET   || "e4f9b8c2d1a3e5f7a9b0c2d4e6f8a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5" },
  { key: "APPWRITE_ENDPOINT",         value: process.env.APPWRITE_ENDPOINT         || "https://cloud.appwrite.io/v1" },
  { key: "APPWRITE_PROJECT_ID",       value: process.env.APPWRITE_PROJECT_ID       || "69c58725000ef2b43f18" },
  { key: "APPWRITE_API_KEY",          value: process.env.APPWRITE_API_KEY          || "" },
  { key: "DATABASE_ID",               value: process.env.DATABASE_ID               || "qofeno_db" },
];

const azureCostVars = [
  { key: "APPWRITE_ENDPOINT",         value: process.env.APPWRITE_ENDPOINT         || "https://cloud.appwrite.io/v1" },
  { key: "APPWRITE_PROJECT_ID",       value: process.env.APPWRITE_PROJECT_ID       || "69c58725000ef2b43f18" },
  { key: "APPWRITE_API_KEY",          value: process.env.APPWRITE_API_KEY          || "" },
  { key: "DATABASE_ID",               value: process.env.DATABASE_ID               || "qofeno_db" },
  { key: "AZURE_TENANT_ID",           value: process.env.AZURE_TENANT_ID           || "" },
  { key: "AZURE_CLIENT_ID",           value: process.env.AZURE_CLIENT_ID           || "be661bd5-7dd3-452f-9e36-e9e7fd40c8a8" },
  { key: "AZURE_CLIENT_SECRET",       value: process.env.AZURE_CLIENT_SECRET       || "" },
  { key: "AZURE_SUBSCRIPTION_ID",     value: process.env.AZURE_SUBSCRIPTION_ID     || "510d191e-6019-42ee-a2a4-0a5fc775e62b" },
  { key: "RESEND_API_KEY",            value: process.env.RESEND_API_KEY            || "" },
  { key: "ADMIN_EMAIL",               value: process.env.ADMIN_EMAIL               || "sohailkhannn.0525@gmail.com" },
];

async function createOrUpdateFunction(id, name, schedule, vars) {
  // Try to create — if 409, just update vars
  try {
    await functions.create(
      id,           // functionId
      name,         // name
      "node-18.0",  // runtime
      ["any"],      // execute
      [],           // events
      schedule,     // schedule (cron)
      900,          // timeout (15min)
      true          // enabled
    );
    console.log(`✓ Created function: ${id}`);
  } catch (err) {
    if (err.code === 409) {
      console.log(`✓ Function ${id} already exists`);
    } else {
      console.error(`✗ Failed to create ${id}: ${err.message}`);
    }
  }

  // Set env vars
  for (const v of vars) {
    try {
      await functions.createVariable(id, v.key, v.value);
      console.log(`  ✓ Set ${v.key}`);
    } catch (err) {
      if (err.code === 409) {
        // Variable exists — update it
        try {
          const existing = await functions.listVariables(id);
          const found = existing.variables.find(x => x.key === v.key);
          if (found) {
            await functions.updateVariable(id, found.$id, v.key, v.value);
            console.log(`  ↺ Updated ${v.key}`);
          }
        } catch (e2) {
          console.warn(`  ⚠ Could not update ${v.key}: ${e2.message}`);
        }
      } else {
        console.warn(`  ⚠ Could not set ${v.key}: ${err.message}`);
      }
    }
  }
}

async function main() {
  console.log("=== Provisioning Appwrite Functions for Azure Integration ===\n");

  await createOrUpdateFunction(
    "azure-manager",
    "Azure Manager",
    "",            // no schedule — called on-demand
    azureVars
  );

  console.log();

  await createOrUpdateFunction(
    "azure-cost-monitor",
    "Azure Cost Monitor",
    "0 9 * * *",  // daily at 9am UTC
    azureCostVars
  );

  console.log("\n✅ Done. azure-manager and azure-cost-monitor are provisioned.");
  console.log("   Run: node scripts/deploy-grouped-functions.mjs to push code.");
}

main().catch(console.error);
