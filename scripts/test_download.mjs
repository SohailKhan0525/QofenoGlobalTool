import { Client, Storage, ID, Permission, Role } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const projId = process.env.APPWRITE_PROJECT_ID || '69c58725000ef2b43f18';
const apiKey = process.env.APPWRITE_API_KEY;

const client = new Client().setEndpoint('https://fra.cloud.appwrite.io/v1').setProject(projId).setKey(apiKey);
const storage = new Storage(client);

async function testDownload() {
  const dummyPdf = Buffer.from('%PDF-1.4\nhello world pdf sample test');
  const uploaded = await storage.createFile('tool_inputs', ID.unique(), InputFile.fromBuffer(dummyPdf, 'test.pdf'), [Permission.read(Role.any())]);
  const fileId = uploaded.$id;
  console.log('Created file ID:', fileId);

  // Method 1: Appwrite Storage SDK getFileDownload
  try {
    const buf = await storage.getFileDownload('tool_inputs', fileId);
    console.log('Method 1 (SDK getFileDownload): SUCCESS! Buffer size:', buf.length || buf.byteLength);
  } catch (err) {
    console.error('Method 1 (SDK getFileDownload): FAILED:', err.message);
  }

  // Method 2: node-fetch to fra.cloud.appwrite.io
  try {
    const r1 = await fetch(`https://fra.cloud.appwrite.io/v1/storage/buckets/tool_inputs/files/${fileId}/download`, {
      headers: { 'X-Appwrite-Project': projId, 'X-Appwrite-Key': apiKey }
    });
    console.log('Method 2 (fetch fra endpoint): Status', r1.status);
    if (!r1.ok) {
      console.log('  Response body:', await r1.text());
    }
  } catch (err) {
    console.error('Method 2 (fetch fra endpoint): FAILED:', err.message);
  }

  // Method 3: node-fetch to cloud.appwrite.io
  try {
    const r3 = await fetch(`https://cloud.appwrite.io/v1/storage/buckets/tool_inputs/files/${fileId}/download`, {
      headers: { 'X-Appwrite-Project': projId, 'X-Appwrite-Key': apiKey }
    });
    console.log('Method 3 (fetch cloud endpoint): Status', r3.status);
    if (!r3.ok) {
      console.log('  Response body:', await r3.text());
    }
  } catch (err) {
    console.error('Method 3 (fetch cloud endpoint): FAILED:', err.message);
  }
}

testDownload().catch(console.error);
