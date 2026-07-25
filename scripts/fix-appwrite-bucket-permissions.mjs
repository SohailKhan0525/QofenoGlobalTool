// scripts/fix-appwrite-bucket-permissions.mjs
import { Client, Storage, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const endpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!projectId || !apiKey) {
  console.error("Missing APPWRITE_PROJECT_ID or APPWRITE_API_KEY");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const storage = new Storage(client);

async function fixBucketPermissions() {
  console.log("\n=== FIXING APPWRITE STORAGE BUCKET PERMISSIONS ===\n");
  const list = await storage.listBuckets();

  const publicPermissions = [
    Permission.read(Role.any()),
    Permission.create(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any()),
  ];

  for (const bucket of list.buckets) {
    const bucketId = bucket.$id;
    console.log(`Updating bucket: ${bucket.name} (${bucketId})...`);

    try {
      await storage.updateBucket(
        bucketId,
        bucket.name,
        publicPermissions,
        false, // fileSecurity = false (public bucket permissions apply to all files)
        bucket.enabled ?? true,
        bucket.maximumFileSize,
        bucket.allowedFileExtensions,
        bucket.compression,
        bucket.encryption,
        bucket.antivirus
      );
      console.log(`✅ Successfully updated permissions on bucket '${bucketId}'!`);
    } catch (e) {
      console.log(`❌ Failed to update bucket '${bucketId}': ${e.message}`);
    }
  }

  console.log("\nAll storage bucket permissions updated successfully!");
}

fixBucketPermissions().catch(console.error);
