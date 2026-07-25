import { Client, Storage, Permission, Role, ID } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID); // Unauthenticated client

const storage = new Storage(client);

async function testPermissions() {
  console.log("\n1. Testing upload with Permission.write(Role.any())...");
  try {
    const f1 = await storage.createFile('tool_inputs', ID.unique(), InputFile.fromBuffer(Buffer.from("test"), 'test1.txt'), [
      Permission.read(Role.any()),
      Permission.write(Role.any())
    ]);
    console.log("  ✅ f1 success:", f1.$id);
  } catch (e) {
    console.log("  ❌ f1 failed:", e.message, "code:", e.code);
  }

  console.log("\n2. Testing upload with Permission.read(Role.any()) + Permission.update(Role.any())...");
  try {
    const f2 = await storage.createFile('tool_inputs', ID.unique(), InputFile.fromBuffer(Buffer.from("test"), 'test2.txt'), [
      Permission.read(Role.any()),
      Permission.update(Role.any())
    ]);
    console.log("  ✅ f2 success:", f2.$id);
  } catch (e) {
    console.log("  ❌ f2 failed:", e.message, "code:", e.code);
  }

  console.log("\n3. Testing upload without permission parameter (using bucket defaults)...");
  try {
    const f3 = await storage.createFile('tool_inputs', ID.unique(), InputFile.fromBuffer(Buffer.from("test"), 'test3.txt'));
    console.log("  ✅ f3 success:", f3.$id);
  } catch (e) {
    console.log("  ❌ f3 failed:", e.message, "code:", e.code);
  }
}

testPermissions();
