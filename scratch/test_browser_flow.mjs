import { Client, Functions, Storage, ID, Permission, Role } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import dotenv from 'dotenv';
dotenv.config();

const endpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.APPWRITE_PROJECT_ID || '69c58725000ef2b43f18';

// Unauthenticated client (same as browser)
const client = new Client().setEndpoint(endpoint).setProject(projectId);
const storage = new Storage(client);
const functions = new Functions(client);

async function testFullBrowserFlow() {
  console.log("\n=== TESTING EXACT BROWSER FLOW ===");

  try {
    // Step 1: Upload PDF file to tool_inputs
    console.log("Step 1: Uploading test PDF to 'tool_inputs' bucket...");
    const dummyPdf = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n160\n%%EOF", "binary");

    const uploaded = await storage.createFile('tool_inputs', ID.unique(), InputFile.fromBuffer(dummyPdf, 'test_sample.pdf'), [
      Permission.read(Role.any()),
      Permission.write(Role.any()),
    ]);
    console.log("  ✓ File uploaded successfully! ID:", uploaded.$id);

    // Step 2: Prepare payload exactly as FileToolWorkspace.tsx
    const payload = {
      tool: 'pdf-compress',
      bucket_id: 'tool_inputs',
      file_id: uploaded.$id,
      input_filename: 'test_sample.pdf',
      user_id: null,
      is_pro_tool: false,
      is_teams_tool: false
    };

    console.log("\nStep 2: Executing function 'qofeno-pdf' synchronously (async = false)...");
    const execution = await functions.createExecution('qofeno-pdf', JSON.stringify(payload), false);
    
    console.log("  ✓ Execution Result:");
    console.log("    Status:", execution.status);
    console.log("    Errors:", execution.errors);
    console.log("    Response Status Code:", execution.responseStatusCode);
    console.log("    ResponseBody:", execution.responseBody);

  } catch (err) {
    console.error("  ❌ Flow failed:", err.message, err);
  }
}

testFullBrowserFlow();
