import { Client, Functions } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const funcs = new Functions(client);

async function inspectExecution() {
  console.log("\n=== INSPECTING EXECUTION 6a64ca71c80dc3a91220 ===");
  try {
    const exec = await funcs.getExecution('qofeno-image', '6a64ca71c80dc3a91220');
    console.log("Status:", exec.status);
    console.log("Status Code:", exec.responseStatusCode);
    console.log("Stdout:", exec.responseBody);
    console.log("Stderr / Errors:", exec.errors);
    console.log("Logs:", exec.logs);
  } catch (e) {
    console.log("Failed to fetch execution:", e.message);
  }
}

inspectExecution();
