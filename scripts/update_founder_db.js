import { Client, Databases, Query, ID } from "node-appwrite";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
    .setProject(process.env.APPWRITE_PROJECT_ID || "69c58725000ef2b43f18")
    .setKey(process.env.APPWRITE_API_KEY);

  const db = new Databases(client);
  const dbId = process.env.DATABASE_ID || "qofeno_db";
  const userId = "69cfb0cb002936fbc1fd";

  console.log(`Updating Database records for user ID: ${userId}...`);

  // 1. users_meta
  try {
    const listMeta = await db.listDocuments(dbId, "users_meta", [Query.equal("user_id", userId)]);
    if (listMeta.total > 0) {
      await db.updateDocument(dbId, "users_meta", listMeta.documents[0].$id, {
        plan: "teams",
        plan_expires_at: "2099-12-31T23:59:59.000Z",
        updated_at: new Date().toISOString()
      });
      console.log(`✓ Updated users_meta document (${listMeta.documents[0].$id}) to plan: teams (Expires: 2099)`);
    } else {
      await db.createDocument(dbId, "users_meta", ID.unique(), {
        user_id: userId,
        plan: "teams",
        plan_expires_at: "2099-12-31T23:59:59.000Z",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      console.log(`✓ Created users_meta document with plan: teams (Expires: 2099)`);
    }
  } catch (err) {
    console.error("users_meta error:", err.message);
  }

  // 2. subscriptions
  try {
    const listSub = await db.listDocuments(dbId, "subscriptions", [Query.equal("user_id", userId)]);
    if (listSub.total > 0) {
      await db.updateDocument(dbId, "subscriptions", listSub.documents[0].$id, {
        plan: "teams",
        status: "active",
        current_period_end: "2099-12-31T23:59:59.000Z"
      });
      console.log(`✓ Updated subscriptions document (${listSub.documents[0].$id}) to plan: teams, status: active`);
    } else {
      await db.createDocument(dbId, "subscriptions", ID.unique(), {
        user_id: userId,
        plan: "teams",
        status: "active",
        payment_provider: "founder_grant",
        payment_sub_id: "founder_sub_id",
        payment_customer: "founder_cust_id",
        current_period_start: new Date().toISOString(),
        current_period_end: "2099-12-31T23:59:59.000Z",
        created_at: new Date().toISOString()
      });
      console.log(`✓ Created subscriptions document with plan: teams, status: active`);
    }
  } catch (err) {
    console.error("subscriptions error:", err.message);
  }
}

main().catch(console.error);
