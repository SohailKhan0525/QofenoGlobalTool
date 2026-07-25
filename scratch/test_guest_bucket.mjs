import { Client, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID); // GUEST CLIENT (NO API KEY)

const storage = new Storage(client);

async function testBucketUpload() {
  console.log("Testing guest upload to 'tool_inputs' storage bucket...");
  try {
    const fileBuf = Buffer.from("Hello Qofeno Test File Content", "utf8");
    const uploaded = await storage.createFile(
      'tool_inputs',
      'test_' + Date.now(),
      InputFile.fromBuffer(fileBuf, 'test.txt')
    );
    console.log("✅ Upload succeeded! File ID:", uploaded.$id);
  } catch (e) {
    console.log("❌ Upload failed:", e.message, "code:", e.code);
  }
}

testBucketUpload();
