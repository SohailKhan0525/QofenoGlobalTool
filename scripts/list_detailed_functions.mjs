import { Client, Functions, Query } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const functions = new Functions(client);

async function main() {
  try {
    let offset = 0;
    const all = [];
    while (true) {
      const res = await functions.list([Query.limit(100), Query.offset(offset)]);
      all.push(...res.functions);
      if (all.length >= res.total) break;
      offset += 100;
    }
    console.log('Total functions in Appwrite:', all.length);
    for (const fn of all) {
      console.log(`- ${fn.$id}: ${fn.name}`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
