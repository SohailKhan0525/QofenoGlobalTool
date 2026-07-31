import { Client, Storage } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '69c58725000ef2b43f18')
  .setKey(process.env.APPWRITE_API_KEY);

const storage = new Storage(client);
const b = await storage.listBuckets();
console.log('Buckets:', b.buckets.map(x => ({ id: x.$id, name: x.name })));
