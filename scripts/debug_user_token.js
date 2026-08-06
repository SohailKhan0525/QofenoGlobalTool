import { Client, Account, Users } from "node-appwrite";
import dotenv from "dotenv";
dotenv.config();

const userId = "69cfb0cb002936fbc1fd";
const rawJwt = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzZWNyZXQiOiI0NmY2OWU1Zjg3ZjAyNDJlNjI1ZTE4OGQ2MWE4YmFjYTMxN2RiNmM4NzgzY2Y5NWI3Y2E2MzRjYzE0NDcwNmI3IiwicHJvdmlkZXIiOiJnb29nbGUiLCJleHAiOjE3ODU5OTUzNDJ9.DesZos0V80wsrzB3l6XGL6fxBmJhnuvEMaraPd0iAHU";
const extractedSecret = "46f69e5f87f0242e625e188d61a8baca317db6c8783cf95b7ca634cc144706b7";

async function run() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1")
    .setProject(process.env.APPWRITE_PROJECT_ID || "69c58725000ef2b43f18")
    .setKey(process.env.APPWRITE_API_KEY);

  const users = new Users(client);

  console.log("=== Test 1: Appwrite REST endpoint /account/sessions/token ===");
  try {
    const res = await fetch("https://fra.cloud.appwrite.io/v1/account/sessions/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": "69c58725000ef2b43f18"
      },
      body: JSON.stringify({ userId, secret: extractedSecret })
    });
    console.log("REST /account/sessions/token status with extractedSecret:", res.status);
    console.log("Response text:", await res.text());
  } catch (err) {
    console.error("REST 1 err:", err.message);
  }

  try {
    const res = await fetch("https://fra.cloud.appwrite.io/v1/account/sessions/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": "69c58725000ef2b43f18"
      },
      body: JSON.stringify({ userId, secret: rawJwt })
    });
    console.log("REST /account/sessions/token status with rawJwt:", res.status);
    console.log("Response text:", await res.text());
  } catch (err) {
    console.error("REST 2 err:", err.message);
  }

  console.log("\n=== Test 2: Server SDK users.createSession ===");
  try {
    const s = await users.createSession(userId);
    console.log("Created server session ID:", s.$id, "Secret:", s.secret ? `${s.secret.substring(0, 20)}...` : "(empty)");
  } catch (err) {
    console.error("Server SDK err:", err.message);
  }
}

run().catch(console.error);
