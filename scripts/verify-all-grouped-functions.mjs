// scripts/verify-all-grouped-functions.mjs
import { Client, Functions, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
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
const funcs = new Functions(client);
const storage = new Storage(client);

async function verify() {
  console.log("\n=== VERIFYING ALL GROUPED FUNCTIONS E2E ===\n");

  // 1. Test Text Tools
  console.log("Testing qofeno-text (word-counter)...");
  try {
    const res = await funcs.createExecution('qofeno-text', JSON.stringify({ tool: 'word-counter', text: 'Qofeno is awesome!' }), false);
    console.log("  ✅ qofeno-text:", res.responseBody);
  } catch (e) {
    console.log("  ❌ qofeno-text failed:", e.message);
  }

  // 2. Test Developer Tools
  console.log("\nTesting qofeno-developer (json-formatter)...");
  try {
    const res = await funcs.createExecution('qofeno-developer', JSON.stringify({ tool: 'json-formatter', json: '{"a":1}', action: 'format' }), false);
    console.log("  ✅ qofeno-developer:", res.responseBody);
  } catch (e) {
    console.log("  ❌ qofeno-developer failed:", e.message);
  }

  // 3. Test PDF Tools with Upload
  console.log("\nUploading test file for qofeno-pdf...");
  try {
    const dummyPdf = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n160\n%%EOF", "binary");
    const uploaded = await storage.createFile('tool_inputs', 'test_pdf_' + Date.now(), InputFile.fromBuffer(dummyPdf, 'test.pdf'));
    console.log("  ✓ Uploaded test PDF to tool_inputs:", uploaded.$id);

    console.log("Testing qofeno-pdf (pdf-compress)...");
    const res = await funcs.createExecution('qofeno-pdf', JSON.stringify({ tool: 'pdf-compress', file_id: uploaded.$id, bucket_id: 'tool_inputs', input_filename: 'test.pdf' }), false);
    console.log("  ✅ qofeno-pdf response:", res.responseBody);
  } catch (e) {
    console.log("  ❌ qofeno-pdf failed:", e.message);
  }

  // 4. Test Image Tools with Upload (1x1 PNG)
  console.log("\nUploading test image for qofeno-image...");
  try {
    const dummyPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
    const uploadedImg = await storage.createFile('tool_inputs', 'test_img_' + Date.now(), InputFile.fromBuffer(dummyPng, 'test.png'));
    console.log("  ✓ Uploaded test PNG to tool_inputs:", uploadedImg.$id);

    console.log("Testing qofeno-image (image-resizer)...");
    const res = await funcs.createExecution('qofeno-image', JSON.stringify({ tool: 'image-resizer', file_id: uploadedImg.$id, bucket_id: 'tool_inputs', input_filename: 'test.png', width: 100, height: 100 }), false);
    console.log("  ✅ qofeno-image response:", res.responseBody);
  } catch (e) {
    console.log("  ❌ qofeno-image failed:", e.message);
  }

  console.log("\n=== VERIFICATION COMPLETE ===");
}

verify().catch(console.error);
