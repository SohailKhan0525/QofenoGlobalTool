import { Client, Functions } from "node-appwrite";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1")
    .setProject(process.env.APPWRITE_PROJECT_ID || "69c58725000ef2b43f18")
    .setKey(process.env.APPWRITE_API_KEY);

  const functions = new Functions(client);

  try {
    await functions.create(
      "azure-cost-monitor",
      "Azure Cost Monitor",
      "node-18.0",
      ["any"],
      [],
      "0 9 * * *",
      300,
      true
    );
    console.log("✓ Created azure-cost-monitor function in Appwrite Cloud");
  } catch (err) {
    if (err.code === 409) {
      console.log("✓ azure-cost-monitor function already exists");
    } else {
      console.error("Failed to create function:", err.message);
    }
  }
}

main().catch(console.error);
