import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

const AZ = '"C:\\Program Files\\Microsoft SDKs\\Azure\\CLI2\\wbin\\az.cmd"';

function run(cmd) {
  console.log(`Executing: az ${cmd}`);
  return execSync(`${AZ} ${cmd}`, { encoding: "utf8", stdio: "inherit" });
}

function runOutput(cmd) {
  return execSync(`${AZ} ${cmd}`, { encoding: "utf8" }).trim();
}

async function main() {
  const acrServer = process.env.AZURE_ACR_SERVER || "qofenoacr3745.azurecr.io";
  const acrName = acrServer.split(".")[0];
  const rg = process.env.AZURE_RESOURCE_GROUP || "qofeno-rg-india";
  const envName = process.env.AZURE_CONTAINER_ENV || "qofeno-env";
  const secret = process.env.QOFENO_CONTAINER_SECRET || "e4f9b8c2d1a3e5f7a9b0c2d4e6f8a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5";
  const acrUser = process.env.AZURE_ACR_USERNAME || "qofenoacr3745";
  const acrPass = process.env.AZURE_ACR_PASSWORD;

  console.log("=========================================");
  console.log("PHASE 1: ONE SMART CONTAINER DEPLOYMENT");
  console.log(`Container: qofeno-processor (1 vCPU, 2GiB)`);
  console.log(`ACR: ${acrName} | RG: ${rg} | ENV: ${envName}`);
  console.log("=========================================\n");

  const name = "qofeno-processor";
  const image = "qofeno-processor:latest";
  const dir = "docker/qofeno-processor";
  const fullImage = `${acrServer}/${image}`;

  console.log(`Deploying container app '${name}'...`);
  run(`containerapp create --name ${name} --resource-group ${rg} --environment ${envName} --image ${fullImage} --registry-server ${acrServer} --registry-username ${acrUser} --registry-password "${acrPass}" --cpu 1.0 --memory 2.0Gi --min-replicas 0 --max-replicas 3 --scale-rule-name "http-rule" --scale-rule-type "http" --scale-rule-http-concurrency 5 --ingress external --target-port 8080 --env-vars QOFENO_CONTAINER_SECRET="${secret}"`);

  const fqdn = runOutput(`containerapp show --name ${name} --resource-group ${rg} --query "properties.configuration.ingress.fqdn" -o tsv`);
  const processorUrl = `https://${fqdn}`;

  console.log(`\n✓ Single Processor Live URL: ${processorUrl}`);

  const envLines = [
    `AZURE_PROCESSOR_URL=${processorUrl}`,
    `AZURE_PDF_CONTAINER_URL=${processorUrl}`,
    `AZURE_MEDIA_CONTAINER_URL=${processorUrl}`,
    `AZURE_IMAGE_CONTAINER_URL=${processorUrl}`
  ].join("\n");

  console.log("\n=========================================");
  console.log("AZURE CONTAINER PROCESSOR CONFIGURED");
  console.log("=========================================");
  console.log(envLines);

  fs.appendFileSync(".env", `\n${envLines}\n`);
  fs.appendFileSync(".env.local", `\n${envLines}\n`);
  console.log("\n✓ Saved URLs to .env and .env.local");
}

main().catch(console.error);
