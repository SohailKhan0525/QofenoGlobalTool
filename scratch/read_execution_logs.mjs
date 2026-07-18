import { Client, Functions, Query } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const functions = new Functions(client);

async function main() {
  const functionId = 'qofeno-pdf';
  console.log(`Fetching latest executions for function: ${functionId}...`);
  const result = await functions.listExecutions(functionId, [
    Query.orderDesc('$createdAt'),
    Query.limit(5)
  ]);
  console.log(`Found ${result.total} executions.`);

  for (const exec of result.executions) {
    console.log(`\nExecution ID: ${exec.$id}`);
    console.log(`Status: ${exec.status}`);
    console.log(`Trigger: ${exec.trigger}`);
    console.log(`Duration: ${exec.duration}s`);
    console.log(`Stdout:\n${exec.responseBody}`);
    console.log(`Log output:\n${exec.logs}`);
    console.log(`Errors:\n${exec.errors}`);
  }
}

main().catch(console.error);
