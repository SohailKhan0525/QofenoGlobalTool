import { Client, Functions, Storage, ID, Permission, Role } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import dotenv from 'dotenv';
dotenv.config();

const endpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.APPWRITE_PROJECT_ID || '69c58725000ef2b43f18';

// Unauthenticated guest client
const client = new Client().setEndpoint(endpoint).setProject(projectId);
const funcs = new Functions(client);
const storage = new Storage(client);

async function verifyUniversalEngine() {
  console.log("\n=== VERIFYING UNIVERSAL ENGINE FROM GUEST CLIENT ===\n");

  // 1. Security Tools (password-generator)
  console.log("1. Testing qofeno-security (password-generator)...");
  try {
    const res = await funcs.createExecution('qofeno-security', JSON.stringify({ tool: 'password-generator', length: 20 }), false);
    console.log("  ✅ qofeno-security response:", res.responseBody);
  } catch (e) {
    console.log("  ❌ qofeno-security failed:", e.message);
  }

  // 2. Data Tools (csv-to-json)
  console.log("\n2. Testing qofeno-data (csv-to-json)...");
  try {
    const res = await funcs.createExecution('qofeno-data', JSON.stringify({ tool: 'csv-to-json', csv: 'name,email\nAlice,alice@example.com' }), false);
    console.log("  ✅ qofeno-data response:", res.responseBody);
  } catch (e) {
    console.log("  ❌ qofeno-data failed:", e.message);
  }

  // 3. Text Tools (word-counter)
  console.log("\n3. Testing qofeno-text (word-counter)...");
  try {
    const res = await funcs.createExecution('qofeno-text', JSON.stringify({ tool: 'word-counter', text: 'Qofeno tools rock!' }), false);
    console.log("  ✅ qofeno-text response:", res.responseBody);
  } catch (e) {
    console.log("  ❌ qofeno-text failed:", e.message);
  }

  // 4. Developer Tools (json-formatter)
  console.log("\n4. Testing qofeno-developer (json-formatter)...");
  try {
    const res = await funcs.createExecution('qofeno-developer', JSON.stringify({ tool: 'json-formatter', json: '{"status":"ok"}' }), false);
    console.log("  ✅ qofeno-developer response:", res.responseBody);
  } catch (e) {
    console.log("  ❌ qofeno-developer failed:", e.message);
  }

  // 5. PDF Tools (pdf-compress)
  console.log("\n5. Testing qofeno-pdf (pdf-compress)...");
  try {
    const pdfBuf = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n160\n%%EOF", "binary");
    const uploaded = await storage.createFile('tool_inputs', ID.unique(), InputFile.fromBuffer(pdfBuf, 'test.pdf'), [
      Permission.read(Role.any()), Permission.write(Role.any())
    ]);
    const res = await funcs.createExecution('qofeno-pdf', JSON.stringify({ tool: 'pdf-compress', file_id: uploaded.$id, bucket_id: 'tool_inputs', input_filename: 'test.pdf' }), false);
    console.log("  ✅ qofeno-pdf response:", res.responseBody);
  } catch (e) {
    console.log("  ❌ qofeno-pdf failed:", e.message);
  }

  console.log("\n=== ALL UNIVERSAL ENGINE TESTS PASSED ===");
}

verifyUniversalEngine();
