import { Client, Functions, Storage, ID } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import dotenv from 'dotenv';
dotenv.config();

const projectId = process.env.APPWRITE_PROJECT_ID || '69c58725000ef2b43f18';

const client1 = new Client().setEndpoint('https://cloud.appwrite.io/v1').setProject(projectId);
const client2 = new Client().setEndpoint('https://fra.cloud.appwrite.io/v1').setProject(projectId);

const storage1 = new Storage(client1);
const storage2 = new Storage(client2);
const funcs1 = new Functions(client1);
const funcs2 = new Functions(client2);

async function testDualEndpoints() {
  console.log("\n=== TESTING DUAL ENDPOINT RESILIENCE ===");

  const dummyPdf = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n160\n%%EOF", "binary");

  let uploadedFileId;

  // Try Endpoint 1
  try {
    console.log("Attempt 1: Uploading to https://cloud.appwrite.io/v1 ...");
    const res1 = await storage1.createFile('tool_inputs', ID.unique(), InputFile.fromBuffer(dummyPdf, 'dual_test.pdf'));
    uploadedFileId = res1.$id;
    console.log("  ✅ Endpoint 1 Upload Succeeded! ID:", uploadedFileId);
  } catch (e) {
    console.log("  ⚠️ Endpoint 1 Upload Failed:", e.message, "-> Retrying with Endpoint 2...");
    const res2 = await storage2.createFile('tool_inputs', ID.unique(), InputFile.fromBuffer(dummyPdf, 'dual_test.pdf'));
    uploadedFileId = res2.$id;
    console.log("  ✅ Endpoint 2 Upload Succeeded! ID:", uploadedFileId);
  }

  // Try Execution
  const payload = { tool: 'pdf-compress', bucket_id: 'tool_inputs', file_id: uploadedFileId, input_filename: 'dual_test.pdf' };

  try {
    console.log("\nAttempt 1: Executing qofeno-pdf on https://cloud.appwrite.io/v1 ...");
    const exec1 = await funcs1.createExecution('qofeno-pdf', JSON.stringify(payload), false);
    console.log("  ✅ Endpoint 1 Execution Succeeded:", exec1.responseBody);
  } catch (e) {
    console.log("  ⚠️ Endpoint 1 Execution Failed:", e.message, "-> Retrying on Endpoint 2...");
    const exec2 = await funcs2.createExecution('qofeno-pdf', JSON.stringify(payload), false);
    console.log("  ✅ Endpoint 2 Execution Succeeded:", exec2.responseBody);
  }
}

testDualEndpoints();
