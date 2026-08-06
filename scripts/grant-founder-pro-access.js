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

  const email = "sohailkhannn.0525@gmail.com";
  console.log(`Searching for founder account with email: ${email}...`);

  let targetUser = null;

  try {
    const list = await users.list([Query.equal("email", email)]);
    if (list.total > 0) {
      targetUser = list.users[0];
      console.log(`✓ Found user in Appwrite Auth: ID = ${targetUser.$id}`);
    } else {
      console.log(`Searching via fuzzy email match...`);
      const allUsers = await users.list([Query.limit(100)]);
      targetUser = allUsers.users.find(u => u.email.toLowerCase().includes("sohailkhannn"));
    }
  } catch (err) {
    console.error("Error searching users:", err.message);
  }

  if (!targetUser) {
    console.log(`User not found in Auth. Creating user ${email}...`);
    try {
      targetUser = await users.create(
        "founder_user_id",
        email,
        undefined,
        "FounderPass2026!",
        "Mohd Zaheer Uddin"
      );
      await users.updateEmailVerification(targetUser.$id, true);
      console.log(`✓ Created user: ${targetUser.$id}`);
    } catch (err) {
      console.error("Failed to create founder user:", err.message);
      return;
    }
  }

  // Update Appwrite User Labels & Preferences
  try {
    await users.updateLabels(targetUser.$id, ["owner", "admin", "pro", "teams"]);
    await users.updatePrefs(targetUser.$id, {
      plan: "teams",
      role: "owner",
      isFounder: true
    });
    console.log("✓ Updated Appwrite user labels & preferences to [owner, admin, pro, teams]");
  } catch (err) {
    console.error("Failed to update user labels/prefs:", err.message);
  }

  // Update or Create profile in Appwrite database
  const dbId = process.env.DATABASE_ID || "qofeno_db";
  try {
    const profiles = await db.listDocuments(dbId, "users_profile", [
      Query.equal("userId", targetUser.$id)
    ]);

    if (profiles.total > 0) {
      await db.updateDocument(dbId, "users_profile", profiles.documents[0].$id, {
        plan: "teams",
        role: "owner",
        email: email,
        name: targetUser.name || "Mohd Zaheer Uddin",
        status: "active"
      });
      console.log(`✓ Updated existing profile document (${profiles.documents[0].$id}) to Teams/Owner plan`);
    } else {
      await db.createDocument(dbId, "users_profile", targetUser.$id, {
        userId: targetUser.$id,
        email: email,
        name: targetUser.name || "Mohd Zaheer Uddin",
        plan: "teams",
        role: "owner",
        status: "active",
        created_at: new Date().toISOString()
      });
      console.log(`✓ Created new profile document for founder with Teams/Owner plan`);
    }
  } catch (err) {
    console.log(`Note updating profile collection: ${err.message}`);
  }

  console.log("\n=========================================");
  console.log("FOUNDER PRO/OWNER ACCESS GRANTED");
  console.log(`Email: ${email}`);
  console.log(`User ID: ${targetUser.$id}`);
  console.log(`Plan: Teams (Unlimited Pro Access)`);
  console.log(`Role: Owner / Admin`);
  console.log("=========================================");
}

main().catch(console.error);
