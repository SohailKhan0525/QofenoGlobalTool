import { Client, Databases, Permission, Role, Query } from "node-appwrite";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1")
    .setProject(process.env.APPWRITE_PROJECT_ID || "69c58725000ef2b43f18")
    .setKey(process.env.APPWRITE_API_KEY);

  const db = new Databases(client);
  const dbId = process.env.DATABASE_ID || "qofeno_db";

  console.log("Checking and updating collection permissions for 'users_meta'...");

  try {
    const coll = await db.getCollection(dbId, "users_meta");
    console.log("Current collection permissions:", coll.$permissions);

    // Update collection permissions so any authenticated user or any user can read users_meta
    await db.updateCollection(
      dbId,
      "users_meta",
      coll.name,
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ],
      coll.documentSecurity
    );
    console.log("✓ Updated collection permissions on 'users_meta' to allow public/user read access");
  } catch (err) {
    console.error("Failed to update collection permissions:", err.message);
  }

  // Now update document permissions for founder user
  const userId = "69cfb0cb002936fbc1fd";
  try {
    const docs = await db.listDocuments(dbId, "users_meta", [Query.equal("user_id", userId)]);
    for (const doc of docs.documents) {
      await db.updateDocument(
        dbId,
        "users_meta",
        doc.$id,
        {
          plan: "teams",
          plan_expires_at: "2099-12-31T23:59:59.000Z"
        },
        [
          Permission.read(Role.any()),
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId))
        ]
      );
      console.log(`✓ Set document permissions on users_meta (${doc.$id}) to allow public/user read`);
    }
  } catch (err) {
    console.error("Failed to update document permissions:", err.message);
  }
}

main().catch(console.error);
