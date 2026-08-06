import { Client, Databases } from "node-appwrite";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1")
    .setProject(process.env.APPWRITE_PROJECT_ID || "69c58725000ef2b43f18")
    .setKey(process.env.APPWRITE_API_KEY);

  const db = new Databases(client);
  const dbId = process.env.DATABASE_ID || "qofeno_db";

  for (const coll of ["users_meta", "subscriptions"]) {
    const list = await db.listAttributes(dbId, coll);
    console.log(`\nAttributes for '${coll}':`);
    console.log(list.attributes.map(a => a.key));
  }
}

main().catch(console.error);
