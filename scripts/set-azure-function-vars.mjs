/**
 * Sets all env vars on azure-manager, azure-cost-monitor and tool Appwrite functions.
 */
import { Client, Functions, ID } from "node-appwrite";
import dotenv from "dotenv";
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const fns = new Functions(client);

// Shared vars present on every Appwrite function
const SHARED = {
  APPWRITE_ENDPOINT:   process.env.APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY:    process.env.APPWRITE_API_KEY,
  DATABASE_ID:         process.env.DATABASE_ID || "qofeno_db",
};

const AZURE_URL = process.env.AZURE_PROCESSOR_URL || "https://qofeno-processor.gentleforest-5357c740.centralindia.azurecontainerapps.io";
const AZURE_SECRET = process.env.QOFENO_CONTAINER_SECRET || "qofeno_azure_secret_key_2024";

// azure-manager specific vars
const MANAGER_VARS = {
  ...SHARED,
  AZURE_PROCESSOR_URL:     AZURE_URL,
  QOFENO_CONTAINER_SECRET: AZURE_SECRET,
};

// azure-cost-monitor specific vars
const MONITOR_VARS = {
  ...SHARED,
  AZURE_TENANT_ID:         process.env.AZURE_TENANT_ID,
  AZURE_CLIENT_ID:         process.env.AZURE_CLIENT_ID || "be661bd5-7dd3-452f-9e36-e9e7fd40c8a8",
  AZURE_CLIENT_SECRET:     process.env.AZURE_CLIENT_SECRET || "",
  AZURE_SUBSCRIPTION_ID:   process.env.AZURE_SUBSCRIPTION_ID,
  RESEND_API_KEY:          process.env.RESEND_API_KEY,
  ADMIN_EMAIL:             process.env.ADMIN_EMAIL || "zaheer@qofeno.dev",
};

const TOOL_VARS = {
  AZURE_PROCESSOR_URL:     AZURE_URL,
  QOFENO_CONTAINER_SECRET: AZURE_SECRET,
};

async function setVars(functionId, vars) {
  console.log(`\nSetting vars on: ${functionId}`);

  let existing = [];
  try {
    const list = await fns.listVariables(functionId);
    existing = list.variables;
  } catch (err) {
    console.error(`  Could not list variables: ${err.message}`);
    return;
  }

  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined || value === null || value === "") {
      console.log(`  ⚠ Skipping ${key} (empty or undefined)`);
      continue;
    }

    const existing_var = existing.find(v => v.key === key);
    try {
      if (existing_var) {
        await fns.updateVariable(functionId, existing_var.$id, key, value);
        console.log(`  ↺ Updated ${key}`);
      } else {
        await fns.createVariable(functionId, ID.unique(), key, value);
        console.log(`  ✓ Set ${key}`);
      }
    } catch (err) {
      console.error(`  ✗ Failed ${key}: ${err.message}`);
    }
  }
}

async function main() {
  console.log("=== Setting Appwrite Function Env Vars ===");

  await setVars("azure-manager",      MANAGER_VARS);
  await setVars("azure-cost-monitor", MONITOR_VARS);

  const groupedToolFns = [
    'qofeno-pdf', 'qofeno-image', 'qofeno-video', 'qofeno-audio',
    'qofeno-text', 'qofeno-developer', 'qofeno-data', 'qofeno-security'
  ];

  for (const toolFn of groupedToolFns) {
    await setVars(toolFn, TOOL_VARS);
  }

  console.log("\n✅ All function env vars set.");
}

main().catch(err => { console.error(err); process.exit(1); });
