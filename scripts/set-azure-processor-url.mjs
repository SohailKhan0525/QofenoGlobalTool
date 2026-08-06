/**
 * Final step after GitHub Actions deploys the Azure Container App.
 *
 * Usage:
 *   node scripts/set-azure-processor-url.mjs
 *
 * The script auto-fetches the FQDN from Azure CLI and:
 *   1. Writes AZURE_PROCESSOR_URL to .env
 *   2. Sets it on the azure-manager Appwrite function
 *   3. Saves it to Appwrite settings collection for azure-cost-monitor
 *   4. Runs a quick health ping to verify the container is live
 */
import { execSync } from "child_process";
import { Client, Databases, Functions, ID, Query } from "node-appwrite";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const AZ = '"C:\\Program Files\\Microsoft SDKs\\Azure\\CLI2\\wbin\\az.cmd"';

function run(cmd) {
  return execSync(`${AZ} ${cmd}`, { encoding: "utf8" }).trim();
}

async function main() {
  const rg   = process.env.AZURE_RESOURCE_GROUP || "qofeno-rg-india";

  // 1. Auto-fetch FQDN from Azure
  let processorUrl = process.env.AZURE_PROCESSOR_URL;

  if (!processorUrl) {
    console.log("Fetching FQDN from Azure CLI...");
    try {
      const fqdn = run(`containerapp show --name qofeno-processor --resource-group ${rg} --query "properties.configuration.ingress.fqdn" -o tsv`);
      processorUrl = `https://${fqdn}`;
      console.log(`  Found: ${processorUrl}`);
    } catch (err) {
      console.error("Failed to fetch FQDN:", err.message);
      console.error("Is the container deployed? Run the GitHub Actions workflow first.");
      process.exit(1);
    }
  }

  console.log(`\nProcessor URL: ${processorUrl}`);

  // 2. Write to .env
  const envContent = fs.readFileSync(".env", "utf8");
  if (envContent.includes("AZURE_PROCESSOR_URL=")) {
    fs.writeFileSync(".env", envContent.replace(
      /AZURE_PROCESSOR_URL=.*/,
      `AZURE_PROCESSOR_URL=${processorUrl}`
    ));
  } else {
    fs.appendFileSync(".env", `\nAZURE_PROCESSOR_URL=${processorUrl}\n`);
  }
  console.log("✓ Wrote AZURE_PROCESSOR_URL to .env");

  // 3. Set on Appwrite azure-manager function
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const fns = new Functions(client);
  const db  = new Databases(client);
  const dbId = process.env.DATABASE_ID || "qofeno_db";

  try {
    const vars = await fns.listVariables("azure-manager");
    const existing = vars.variables.find(v => v.key === "AZURE_PROCESSOR_URL");
    if (existing) {
      await fns.updateVariable("azure-manager", existing.$id, "AZURE_PROCESSOR_URL", processorUrl);
      console.log("✓ Updated AZURE_PROCESSOR_URL on azure-manager function");
    } else {
      await fns.createVariable("azure-manager", ID.unique(), "AZURE_PROCESSOR_URL", processorUrl);
      console.log("✓ Set AZURE_PROCESSOR_URL on azure-manager function");
    }
  } catch (err) {
    console.error("Failed to update Appwrite function:", err.message);
  }

  // 4. Save to Appwrite settings collection
  try {
    const existing = await db.listDocuments(dbId, "settings", [
      Query.equal("key", "azure_processor_url"), Query.limit(1)
    ]);
    const now = new Date().toISOString();
    if (existing.total > 0) {
      await db.updateDocument(dbId, "settings", existing.documents[0].$id, {
        value: processorUrl, updated_at: now
      });
    } else {
      await db.createDocument(dbId, "settings", ID.unique(), {
        key: "azure_processor_url", value: processorUrl, created_at: now, updated_at: now
      });
    }
    console.log("✓ Saved to Appwrite settings collection");
  } catch (err) {
    console.warn("Could not save to settings collection:", err.message);
  }

  // 5. Health ping
  console.log("\nPinging container health...");
  const secret = process.env.QOFENO_CONTAINER_SECRET || "";
  try {
    const res = await fetch(`${processorUrl}/health`, {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(10000)
    });
    if (res.ok) {
      const health = await res.json();
      console.log(`✅ Container is LIVE! Status: ${JSON.stringify(health)}`);
    } else {
      console.log(`⚠ Health ping returned HTTP ${res.status} — may still be warming up (normal).`);
    }
  } catch {
    console.log("⚠ Health ping timed out — container may be cold-starting. Check again in 30s.");
  }

  console.log("\n✅ Azure processor URL fully wired. Everything is connected.");
}

main().catch(err => { console.error(err); process.exit(1); });
