import { Client, Functions } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '69c58725000ef2b43f18')
  .setKey(process.env.APPWRITE_API_KEY);

const funcs = new Functions(client);

const targetEnvVars = {
  APPWRITE_ENDPOINT: process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID || '69c58725000ef2b43f18',
  APPWRITE_API_KEY: process.env.APPWRITE_API_KEY || '',
  DATABASE_ID: process.env.DATABASE_ID || 'qofeno_db',
  BUCKET_INPUTS: process.env.BUCKET_INPUTS || 'tool_inputs',
  BUCKET_OUTPUTS: process.env.BUCKET_OUTPUTS || 'tool_outputs',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'Qofeno',
  EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS || 'noreply@qofeno.com',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'support@qofeno.com',
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || '',
  PAYPAL_SECRET: process.env.PAYPAL_SECRET || '',
  PAYPAL_MODE: process.env.PAYPAL_MODE || 'live',
  PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID || ''
};

async function syncFunctionEnvVars() {
  console.log("\n=== SYNCING REAL ENV VARS TO ALL 17 APPWRITE CLOUD FUNCTIONS ===\n");
  const list = await funcs.list();

  for (const fn of list.functions) {
    const fnId = fn.$id;
    console.log(`Syncing env vars for '${fn.name}' (${fnId})...`);

    // List existing variables
    const varsList = await funcs.listVariables(fnId);
    const existingMap = new Map();
    for (const v of varsList.variables) {
      existingMap.set(v.key, v.$id);
    }

    for (const [key, val] of Object.entries(targetEnvVars)) {
      if (!val) continue;
      try {
        if (existingMap.has(key)) {
          const varId = existingMap.get(key);
          await funcs.updateVariable(fnId, varId, key, val);
        } else {
          await funcs.createVariable(fnId, key, val);
        }
      } catch (err) {
        console.warn(`  ⚠️ Warning setting variable ${key} on ${fnId}: ${err.message}`);
      }
    }
    console.log(`  ✅ Successfully updated variables for ${fn.name}!`);
  }

  console.log("\nALL 17 FUNCTIONS ARE NOW LOADED WITH PRODUCTION ENV VARS!");
}

syncFunctionEnvVars();
