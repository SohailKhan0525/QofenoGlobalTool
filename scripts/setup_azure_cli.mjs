import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const AZ = '"C:\\Program Files\\Microsoft SDKs\\Azure\\CLI2\\wbin\\az.cmd"';

function run(cmd, silent = false) {
  try {
    return execSync(`${AZ} ${cmd}`, { encoding: "utf8" }).trim();
  } catch (err) {
    if (!silent) console.error(`Command failed: ${cmd}\nError: ${err.message}`);
    throw err;
  }
}

async function main() {
  const rg = "qofeno-rg-india";
  const location = "centralindia";
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const acrName = `qofenoacr${randomSuffix}`;
  const envName = "qofeno-env";

  console.log(`1. Creating Resource Group '${rg}' in '${location}'...`);
  run(`group create --name ${rg} --location ${location}`);
  console.log(`✓ Resource Group '${rg}' created.`);

  console.log(`\n2. Creating Container Registry '${acrName}'...`);
  run(`acr create --name ${acrName} --resource-group ${rg} --sku Basic --admin-enabled true`);
  console.log(`✓ Container Registry '${acrName}' created.`);

  const acrServer = run(`acr show --name ${acrName} --query loginServer -o tsv`);
  const acrUser = run(`acr credential show --name ${acrName} --query username -o tsv`);
  const acrPass = run(`acr credential show --name ${acrName} --query "passwords[0].value" -o tsv`);

  console.log(`\n3. Ensuring Azure Container Apps CLI extension...`);
  try {
    run(`extension add --name containerapp --upgrade --yes`);
  } catch {}

  console.log(`\n4. Registering Microsoft.App namespace...`);
  try {
    run(`provider register --namespace Microsoft.App --wait`);
  } catch {}

  console.log(`\n5. Creating Container Apps Environment '${envName}'...`);
  run(`containerapp env create --name ${envName} --resource-group ${rg} --location ${location}`);
  console.log(`✓ Container Apps Environment '${envName}' created.`);

  const outputLines = [
    `AZURE_RESOURCE_GROUP=${rg}`,
    `AZURE_CONTAINER_ENV=${envName}`,
    `AZURE_ACR_SERVER=${acrServer}`,
    `AZURE_ACR_USERNAME=${acrUser}`,
    `AZURE_ACR_PASSWORD=${acrPass}`,
    `AZURE_LOCATION=${location}`
  ].join("\n");

  console.log("\n=========================================");
  console.log("AZURE INFRASTRUCTURE PROVISIONED");
  console.log("=========================================");
  console.log(outputLines);

  const envPath = path.resolve(".env");
  const envLocalPath = path.resolve(".env.local");

  fs.appendFileSync(envPath, `\n${outputLines}\n`);
  fs.appendFileSync(envLocalPath, `\n${outputLines}\n`);

  console.log("\n✓ Credentials updated in .env and .env.local");
}

main().catch(console.error);
