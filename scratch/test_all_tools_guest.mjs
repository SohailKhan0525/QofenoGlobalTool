import { Client, Functions, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import dotenv from 'dotenv';
dotenv.config();

const endpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.APPWRITE_PROJECT_ID;

const client = new Client().setEndpoint(endpoint).setProject(projectId); // UNAUTHENTICATED CLIENT
const funcs = new Functions(client);
const storage = new Storage(client);

async function testAllToolsGuest() {
  console.log("\n=== TESTING ALL TOOL MODULES FROM GUEST CLIENT ===\n");

  // 1. Text Tool
  console.log("1. Testing qofeno-text (word-counter)...");
  try {
    const res = await funcs.createExecution('qofeno-text', JSON.stringify({ tool: 'word-counter', text: 'Hello Qofeno Guest Test' }), false);
    console.log("  ✅ qofeno-text:", res.responseBody);
  } catch (e) {
    console.log("  ❌ qofeno-text failed:", e.message);
  }

  // 2. Developer Tool
  console.log("\n2. Testing qofeno-developer (json-formatter)...");
  try {
    const res = await funcs.createExecution('qofeno-developer', JSON.stringify({ tool: 'json-formatter', json: '{"qofeno":"awesome"}', action: 'format' }), false);
    console.log("  ✅ qofeno-developer:", res.responseBody);
  } catch (e) {
    console.log("  ❌ qofeno-developer failed:", e.message);
  }

  // 3. PDF Tool (upload file first)
  console.log("\n3. Testing qofeno-pdf (pdf-compress)...");
  try {
    const pdfBuf = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n160\n%%EOF", "binary");
    const uploaded = await storage.createFile('tool_inputs', 'guest_pdf_' + Date.now(), InputFile.fromBuffer(pdfBuf, 'test.pdf'));
    console.log("  ✓ Uploaded PDF to tool_inputs:", uploaded.$id);
    const res = await funcs.createExecution('qofeno-pdf', JSON.stringify({ tool: 'pdf-compress', file_id: uploaded.$id, bucket_id: 'tool_inputs', input_filename: 'test.pdf' }), false);
    console.log("  ✅ qofeno-pdf:", res.responseBody);
  } catch (e) {
    console.log("  ❌ qofeno-pdf failed:", e.message);
  }

  // 4. Image Tool (upload file first)
  console.log("\n4. Testing qofeno-image (image-resizer)...");
  try {
    const pngBuf = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
    const uploadedImg = await storage.createFile('tool_inputs', 'guest_img_' + Date.now(), InputFile.fromBuffer(pngBuf, 'test.png'));
    console.log("  ✓ Uploaded PNG to tool_inputs:", uploadedImg.$id);
    const res = await funcs.createExecution('qofeno-image', JSON.stringify({ tool: 'image-resizer', file_id: uploadedImg.$id, bucket_id: 'tool_inputs', input_filename: 'test.png', width: 200, height: 200 }), false);
    console.log("  ✅ qofeno-image:", res.responseBody);
  } catch (e) {
    console.log("  ❌ qofeno-image failed:", e.message);
  }

  console.log("\n=== ALL GUEST TESTS COMPLETE ===");
}

testAllToolsGuest();
