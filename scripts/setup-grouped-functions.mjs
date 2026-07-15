import { Client, Functions, ID } from "node-appwrite";
import dotenv from "dotenv";
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const functions = new Functions(client);

const FUNCTIONS_TO_CREATE = [
  // 8 Grouped Functions
  { id: "qofeno-pdf", name: "Qofeno PDF Tools", runtime: "node-18.0", timeout: 900 },
  { id: "qofeno-image", name: "Qofeno Image Tools", runtime: "node-18.0", timeout: 300 },
  { id: "qofeno-video", name: "Qofeno Video Tools", runtime: "node-18.0", timeout: 900 },
  { id: "qofeno-audio", name: "Qofeno Audio Tools", runtime: "node-18.0", timeout: 600 },
  { id: "qofeno-text", name: "Qofeno Text Tools", runtime: "node-18.0", timeout: 120 },
  { id: "qofeno-developer", name: "Qofeno Developer Tools", runtime: "node-18.0", timeout: 120 },
  { id: "qofeno-data", name: "Qofeno Data Tools", runtime: "node-18.0", timeout: 120 },
  { id: "qofeno-security", name: "Qofeno Security Tools", runtime: "node-18.0", timeout: 120 },

  // Platform Functions
  { id: "auth-webhook", name: "platform-auth-webhook", runtime: "node-18.0", timeout: 60, events: ["users.*.create"] },
  { id: "new-tool-notifier", name: "platform-new-tool-notifier", runtime: "node-18.0", timeout: 60, events: ["databases.*.collections.tools.documents.*.create"] },
  { id: "whats-new-notifier", name: "platform-whats-new-notifier", runtime: "node-18.0", timeout: 60, events: ["databases.*.collections.whats_new.documents.*.create"] },
  { id: "track-event", name: "platform-track-event", runtime: "node-18.0", timeout: 60 },
  { id: "contact-form", name: "platform-contact-form", runtime: "node-18.0", timeout: 60 },
  { id: "create-download-link", name: "platform-create-download-link", runtime: "node-18.0", timeout: 60 },
  { id: "payment-webhook", name: "platform-payment-webhook", runtime: "node-18.0", timeout: 60 },
  { id: "paypal-webhook", name: "platform-paypal-webhook", runtime: "node-18.0", timeout: 60 },
  { id: "auto-publish-blog", name: "platform-auto-publish-blog", runtime: "node-18.0", timeout: 60 }
];

const ENV_VARS = [
  { key: "APPWRITE_ENDPOINT", value: process.env.APPWRITE_ENDPOINT },
  { key: "APPWRITE_PROJECT_ID", value: process.env.APPWRITE_PROJECT_ID },
  { key: "APPWRITE_API_KEY", value: process.env.APPWRITE_API_KEY },
  { key: "DATABASE_ID", value: "qofeno_db" },
  { key: "BUCKET_INPUTS", value: "tool_inputs" },
  { key: "BUCKET_OUTPUTS", value: "tool_outputs" },
  { key: "RESEND_API_KEY", value: process.env.RESEND_API_KEY },
  { key: "EMAIL_FROM_NAME", value: process.env.EMAIL_FROM_NAME },
  { key: "EMAIL_FROM_ADDRESS", value: process.env.EMAIL_FROM_ADDRESS },
  { key: "ADMIN_EMAIL", value: process.env.ADMIN_EMAIL },
  { key: "PAYPAL_CLIENT_ID", value: process.env.PAYPAL_CLIENT_ID },
  { key: "PAYPAL_SECRET", value: process.env.PAYPAL_SECRET },
  { key: "PAYPAL_MODE", value: process.env.PAYPAL_MODE },
  { key: "PAYPAL_WEBHOOK_ID", value: process.env.PAYPAL_WEBHOOK_ID }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runWithRetry(fn, maxRetries = 20, delay = 30000) {
  let lastErr;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (err.code === 409) throw err; // Don't retry already existing
      console.warn(`[WARN] Action failed. Retrying in ${delay / 1000}s... (${err.message})`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

async function main() {
  for (const fn of FUNCTIONS_TO_CREATE) {
    console.log(`Setting up function: ${fn.name} (${fn.id})...`);
    
    // 1. Create or update the function (Ensure we do not skip on error!)
    let fnDoc;
    let success = false;
    while (!success) {
      try {
        fnDoc = await runWithRetry(() => functions.create({
          functionId: fn.id,
          name: fn.name,
          runtime: fn.runtime,
          execute: ["any"],
          events: fn.events || [],
          timeout: fn.timeout
        }));
        console.log(`  ✓ Created new function: ${fn.id}`);
        success = true;
      } catch (err) {
        if (err.code === 409) {
          console.log(`  - Function already exists, updating triggers...`);
          try {
            await runWithRetry(() => functions.update({
              functionId: fn.id,
              name: fn.name,
              execute: ["any"],
              events: fn.events || [],
              timeout: fn.timeout
            }));
            console.log(`  ✓ Updated existing function triggers.`);
            success = true;
          } catch (upErr) {
            console.error(`  [ERROR] Failed to update function ${fn.id}: ${upErr.message}`);
            console.log(`  Retrying function update in 30s...`);
            await sleep(30000);
          }
        } else {
          console.error(`  [ERROR] Failed to create/get function ${fn.id}: ${err.message}`);
          console.log(`  Retrying function creation in 30s...`);
          await sleep(30000);
        }
      }
    }

    // 2. Set variables
    for (const v of ENV_VARS) {
      if (!v.value) {
        console.warn(`  [WARN] Skipping empty variable: ${v.key}`);
        continue;
      }
      let varSuccess = false;
      while (!varSuccess) {
        try {
          await runWithRetry(() => functions.createVariable({
            functionId: fn.id,
            variableId: ID.unique(),
            key: v.key,
            value: v.value
          }));
          console.log(`    ✓ Set variable: ${v.key}`);
          varSuccess = true;
        } catch (err) {
          if (err.code === 409) {
            try {
              const varsList = await runWithRetry(() => functions.listVariables(fn.id));
              const existingVar = varsList.variables.find(item => item.key === v.key);
              if (existingVar) {
                await runWithRetry(() => functions.updateVariable({
                  functionId: fn.id,
                  variableId: existingVar.$id,
                  key: v.key,
                  value: v.value
                }));
                console.log(`    ✓ Updated variable: ${v.key}`);
                varSuccess = true;
              } else {
                // If not found in list but returned 409, try again
                console.warn(`    [WARN] Variable 409 but not found in list, retrying...`);
                await sleep(5000);
              }
            } catch (upErr) {
              console.error(`    [ERROR] Failed to update variable ${v.key}: ${upErr.message}`);
              await sleep(15000);
            }
          } else {
            console.error(`    [ERROR] Failed to create variable ${v.key}: ${err.message}`);
            await sleep(15000);
          }
        }
      }
      await sleep(100);
    }
    
    console.log(`  ✓ Function ${fn.id} is ready.`);
    await sleep(5000); // 5s cooldown between functions
  }
}

main().catch(console.error);
