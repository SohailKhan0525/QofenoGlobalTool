import { Client, Databases, Users, ID, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.DATABASE_ID;

if (!endpoint || !projectId || !apiKey || !databaseId) {
  console.error("Missing Appwrite credentials in environment");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);
const users = new Users(client);

async function run() {
  console.log("Fetching users...");
  try {
    const userList = await users.list();
    console.log(`Found ${userList.total} users.`);

    let count = 0;
    for (const user of userList.users) {
      // Check if this user already got the notification
      const existing = await databases.listDocuments(databaseId!, 'notifications', [
        Query.equal('user_id', user.$id),
        Query.equal('title', '142+ New Tools Added!'),
      ]);

      if (existing.total === 0) {
        await databases.createDocument(databaseId!, 'notifications', ID.unique(), {
          user_id: user.$id,
          title: '142+ New Tools Added!',
          message: 'We have added dozens of real Appwrite-integrated tools, including 19 new Audio Tools, Video Processors, and more!',
          type: 'success',
          read: false,
          link: '/tools',
          created_at: new Date().toISOString(),
        });
        count++;
        console.log(`Notified user: ${user.email}`);
      } else {
        console.log(`User ${user.email} already has the notification.`);
      }
    }
    console.log(`Sent ${count} new notifications.`);
  } catch (err: any) {
    console.error("Failed to seed notifications:", err?.message);
  }
}

run().catch(console.error);
