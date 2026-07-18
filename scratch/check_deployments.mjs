import { Client, Functions } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const functions = new Functions(client);

async function main() {
  const functionId = 'qofeno-text';
  console.log(`Fetching deployments for function: ${functionId}...`);
  const result = await functions.listDeployments(functionId);
  console.log(`Total deployments: ${result.total}`);
  for (const dep of result.deployments.slice(0, 5)) {
    console.log(`\nDeployment ID: ${dep.$id}`);
    console.log(`Entrypoint: ${dep.entrypoint}`);
    console.log(`Status: ${dep.status}`);
    console.log(`Activated: ${dep.activate}`);
    console.log(`Build Log:\n${dep.buildLogs || 'No build logs available'}`);
  }
}

main().catch(console.error);
