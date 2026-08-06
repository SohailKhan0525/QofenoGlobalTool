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

  const targetEmail = "sohailkhannn.0525@gmail.com";
  console.log(`Searching Appwrite Auth specifically for '${targetEmail}'...`);

  const list = await users.list([Query.equal("email", targetEmail)]);
  console.log(`Found ${list.total} matching user(s):`);

  for (const u of list.users) {
    console.log(`\nUser ID: ${u.$id}`);
    console.log(`Email: ${u.email}`);
    console.log(`Name: ${u.name}`);
    console.log(`Email Verified: ${u.emailVerification}`);
    console.log(`Labels: ${JSON.stringify(u.labels)}`);
    console.log(`Preferences: ${JSON.stringify(u.prefs)}`);

    // Check users_meta
    const meta = await db.listDocuments(dbId, "users_meta", [Query.equal("user_id", u.$id)]);
    console.log(`users_meta docs: ${meta.total}`);
    for (const m of meta.documents) {
      console.log(`  Meta Doc ID: ${m.$id} | Plan: ${m.plan} | Expires: ${m.plan_expires_at} | Permissions: ${JSON.stringify(m.$permissions)}`);
    }

    // Check subscriptions
    const sub = await db.listDocuments(dbId, "subscriptions", [Query.equal("user_id", u.$id)]);
    console.log(`subscriptions docs: ${sub.total}`);
    for (const s of sub.documents) {
      console.log(`  Sub Doc ID: ${s.$id} | Plan: ${s.plan} | Status: ${s.status}`);
    }
  }
}

main().catch(console.error);
