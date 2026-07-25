import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);

async function checkAndFixToolExecutions() {
  const databaseId = process.env.DATABASE_ID || 'qofeno_db';
  console.log("\n=== CHECKING & UPDATING tool_executions COLLECTION ===");

  try {
    const col = await db.getCollection(databaseId, 'tool_executions');
    console.log("Collection name:", col.name, "| ID:", col.$id);
    console.log("Current Permissions:", col.$permissions);

    const publicPermissions = [
      Permission.read(Role.any()),
      Permission.create(Role.any()),
      Permission.update(Role.any()),
      Permission.delete(Role.any()),
    ];

    await db.updateCollection(
      databaseId,
      'tool_executions',
      col.name,
      publicPermissions,
      col.documentSecurity ?? false,
      col.enabled ?? true
    );

    console.log("✅ Successfully updated 'tool_executions' collection permissions to Role.any()!");

  } catch (e) {
    console.error("Error with tool_executions collection:", e.message);
  }
}

checkAndFixToolExecutions();
