import { Client, Users, Databases, Query } from "node-appwrite";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1")
    .setProject(process.env.APPWRITE_PROJECT_ID || "69c58725000ef2b43f18")
    .setKey(process.env.APPWRITE_API_KEY);

  const users = new Users(client);
  const db = new Databases(client);
  const dbId = process.env.DATABASE_ID || "qofeno_db";

  console.log("=== Checking Appwrite Auth Users ===");
  const listUsers = await users.list([Query.limit(100)]);
  for (const u of listUsers.users) {
    if (u.email.includes("sohail") || u.email.includes("gmail")) {
      console.log(`User: ${u.$id} | Email: ${u.email} | Name: ${u.name} | Labels: ${JSON.stringify(u.labels)} | Prefs: ${JSON.stringify(u.prefs)}`);
    }
  }

  console.log("\n=== Checking users_meta Documents ===");
  const listMeta = await db.listDocuments(dbId, "users_meta");
  for (const doc of listMeta.documents) {
    console.log(`Doc ID: ${doc.$id} | user_id: ${doc.user_id} | Plan: ${doc.plan} | Expires: ${doc.plan_expires_at} | Permissions: ${JSON.stringify(doc.$permissions)}`);
  }
}

main().catch(console.error);
