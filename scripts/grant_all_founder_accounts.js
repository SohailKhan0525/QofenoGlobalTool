import { Client, Users, Databases, Query, Permission, Role, ID } from "node-appwrite";
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

  const founderEmails = [
    "sohailkhannn.0525@gmail.com",
    "sohailkhannn.05@gmail.com",
    "mohdzaheeruddin0525@gmail.com",
    "sohailkhannn5@gmail.com",
    "sohhannn.0525@gmail.com"
  ];

  console.log("=== Granting Unlimited Teams / Owner Access to All Founder Accounts ===");

  const allUsers = await users.list([Query.limit(100)]);

  for (const user of allUsers.users) {
    if (founderEmails.some(e => user.email.toLowerCase() === e.toLowerCase())) {
      console.log(`\nProcessing Founder User: ${user.email} (ID: ${user.$id})`);

      try {
        await users.updateLabels(user.$id, ["owner", "admin", "pro", "teams"]);
        await users.updatePrefs(user.$id, {
          plan: "teams",
          role: "owner",
          isFounder: true
        });
        console.log(`  ✓ Updated Appwrite labels & preferences to Teams/Owner`);
      } catch (err) {
        console.error(`  ❌ Failed to update labels/prefs: ${err.message}`);
      }

      // Update or create users_meta
      try {
        const listMeta = await db.listDocuments(dbId, "users_meta", [Query.equal("user_id", user.$id)]);
        if (listMeta.total > 0) {
          await db.updateDocument(
            dbId,
            "users_meta",
            listMeta.documents[0].$id,
            {
              plan: "teams",
              plan_expires_at: "2099-12-31T23:59:59.000Z",
              updated_at: new Date().toISOString()
            },
            [
              Permission.read(Role.any()),
              Permission.read(Role.user(user.$id)),
              Permission.update(Role.user(user.$id)),
              Permission.delete(Role.user(user.$id))
            ]
          );
          console.log(`  ✓ Updated users_meta (${listMeta.documents[0].$id}) to Teams plan`);
        } else {
          const created = await db.createDocument(
            dbId,
            "users_meta",
            ID.unique(),
            {
              user_id: user.$id,
              plan: "teams",
              plan_expires_at: "2099-12-31T23:59:59.000Z",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            [
              Permission.read(Role.any()),
              Permission.read(Role.user(user.$id)),
              Permission.update(Role.user(user.$id)),
              Permission.delete(Role.user(user.$id))
            ]
          );
          console.log(`  ✓ Created users_meta (${created.$id}) with Teams plan`);
        }
      } catch (err) {
        console.error(`  ❌ users_meta error: ${err.message}`);
      }

      // Update or create subscriptions
      try {
        const listSub = await db.listDocuments(dbId, "subscriptions", [Query.equal("user_id", user.$id)]);
        if (listSub.total > 0) {
          await db.updateDocument(
            dbId,
            "subscriptions",
            listSub.documents[0].$id,
            {
              plan: "teams",
              status: "active",
              current_period_end: "2099-12-31T23:59:59.000Z"
            },
            [
              Permission.read(Role.any()),
              Permission.read(Role.user(user.$id))
            ]
          );
          console.log(`  ✓ Updated subscriptions document (${listSub.documents[0].$id})`);
        } else {
          const createdSub = await db.createDocument(
            dbId,
            "subscriptions",
            ID.unique(),
            {
              user_id: user.$id,
              plan: "teams",
              status: "active",
              payment_provider: "founder_grant",
              payment_sub_id: `founder_sub_${user.$id}`,
              payment_customer: `founder_cust_${user.$id}`,
              current_period_start: new Date().toISOString(),
              current_period_end: "2099-12-31T23:59:59.000Z",
              created_at: new Date().toISOString()
            },
            [
              Permission.read(Role.any()),
              Permission.read(Role.user(user.$id))
            ]
          );
          console.log(`  ✓ Created subscriptions document (${createdSub.$id})`);
        }
      } catch (err) {
        console.error(`  ❌ subscriptions error: ${err.message}`);
      }
    }
  }

  console.log("\n=========================================");
  console.log("ALL FOUNDER ACCOUNTS GRANTED TEAMS ACCESS");
  console.log("=========================================");
}

main().catch(console.error);
