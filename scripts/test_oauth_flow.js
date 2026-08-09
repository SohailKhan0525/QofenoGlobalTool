import { Client, Users, Account } from "node-appwrite";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
    .setProject(process.env.APPWRITE_PROJECT_ID || "69c58725000ef2b43f18")
    .setKey(process.env.APPWRITE_API_KEY);

  const users = new Users(client);
  const targetEmail = "sohailkhannn.0525@gmail.com";
  const list = await users.list();
  const founder = list.users.find(u => u.email.toLowerCase() === targetEmail);

  if (!founder) {
    console.log("Founder user not found!");
    return;
  }

  console.log("Found Founder user:", founder.$id, founder.email);

  // Test creating a session for the user using server SDK
  const session = await users.createSession(founder.$id);
  console.log("Created session via server SDK:");
  console.log("Session ID:", session.$id);
  console.log("Session Secret:", session.secret ? `${session.secret.substring(0, 20)}...` : "(empty)");

  // Test getting account using directGetAccount logic with session.secret
  if (session.secret) {
    const res = await fetch("https://cloud.appwrite.io/v1/account", {
      headers: {
        "X-Appwrite-Project": "69c58725000ef2b43f18",
        "X-Appwrite-Session": session.secret,
      }
    });
    console.log("GET /account status with session.secret:", res.status);
    if (res.ok) {
      const data = await res.json();
      console.log("Successfully fetched account! User ID:", data.$id, "Email:", data.email);
    } else {
      console.log("Failed to fetch account:", await res.text());
    }
  }
}

test().catch(console.error);
