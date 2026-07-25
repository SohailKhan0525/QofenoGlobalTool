#!/usr/bin/env node
/**
 * deploy-all-functions.mjs
 * Deploys all 8 tool functions to Appwrite Cloud via CLI (appwrite functions create-deployment)
 * Run from project root after running: node scripts/deploy-universal-engine.mjs
 */
import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

const FUNCTIONS = [
  'qofeno-pdf', 'qofeno-image', 'qofeno-video', 'qofeno-audio',
  'qofeno-text', 'qofeno-developer', 'qofeno-data', 'qofeno-security'
];

console.log("\n=== DEPLOYING ALL 8 FUNCTIONS VIA APPWRITE CLI ===\n");
console.log("Endpoint:", process.env.APPWRITE_ENDPOINT);
console.log("Project:", process.env.APPWRITE_PROJECT_ID);
console.log("");

for (const fnId of FUNCTIONS) {
  console.log(`Deploying ${fnId}...`);
  try {
    const out = execSync(
      `appwrite functions create-deployment --function-id ${fnId} --code functions/${fnId} --entrypoint "src/main.js" --commands "npm install" --activate true`,
      {
        stdio: 'pipe',
        timeout: 120000,
        env: {
          ...process.env,
          APPWRITE_ENDPOINT: process.env.APPWRITE_ENDPOINT,
          APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID,
          APPWRITE_KEY: process.env.APPWRITE_API_KEY,
        }
      }
    );
    console.log(`  ✅ ${fnId}: ${out.toString().trim().split('\n').pop()}`);
  } catch (e) {
    const msg = e.stdout?.toString() || e.stderr?.toString() || e.message;
    console.log(`  ❌ ${fnId}: ${msg.substring(0, 300)}`);
  }
}

console.log("\nAll deployments triggered! Check Appwrite console for build status.");
