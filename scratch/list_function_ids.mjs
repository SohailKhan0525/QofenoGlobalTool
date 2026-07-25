import { Client, Functions } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const funcs = new Functions(client);

async function listAll() {
  const res = await funcs.list();
  console.log("\n=== APPWRITE CLOUD FUNCTION LIST ===");
  for (const fn of res.functions) {
    console.log(`Name: "${fn.name}" | ID: "${fn.$id}"`);
  }
}

listAll();
