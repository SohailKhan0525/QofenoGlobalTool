import fs from 'fs';
import path from 'path';
import { Client, Functions, Storage, ID, Permission, Role } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '69c58725000ef2b43f18')
  .setKey(process.env.APPWRITE_API_KEY || process.env.APPWRITE_SECRET_KEY || 'standard_de2628e1d388cc087d06c18709188fbba1f70ad9fb89ebb5a629d99a50b5d982c0039ecee34d13c38cf6d9376cc2076c7f38f501b5c235c9ca459dfbbe38a1a715c8fb85bf86405c1e6c322e4f6b8ceb70055f3bf146cf8cb4c8cc6d66e5747d5a8b6c6a28c070f658cd50e0a4caeddf59e59f10889149c0d32ad79457d46998');

const functions = new Functions(client);
const storage = new Storage(client);

const bucketInputs = process.env.VITE_APPWRITE_BUCKET_TOOL_INPUTS || 'tool_inputs';

async function runTests() {
  console.log('=== RUNNING FULL TOOL FILE INTEGRATION TESTS ===\n');

  const pdfPath = path.join(process.cwd(), 'scratch', 'test_files', 'sample.pdf');
  let uploadedFileId = null;

  try {
    const file = InputFile.fromPath(pdfPath, 'sample.pdf');
    const uploaded = await storage.createFile(
      bucketInputs,
      ID.unique(),
      file,
      [Permission.read(Role.any()), Permission.delete(Role.any())]
    );
    uploadedFileId = uploaded.$id;
    console.log(`Uploaded test PDF to bucket '${bucketInputs}' with ID: ${uploadedFileId}\n`);
  } catch (err) {
    console.error('Failed to upload test file to Appwrite storage:', err.message);
  }

  const testSuite = [
    {
      slug: 'pdf-compressor',
      funcId: 'qofeno-pdf',
      payload: {
        tool: 'pdf-compressor',
        bucket_id: bucketInputs,
        file_id: uploadedFileId,
        input_filename: 'sample.pdf',
        compression_level: 'Medium'
      }
    },
    {
      slug: 'base64-encoder',
      funcId: 'qofeno-developer',
      payload: {
        tool: 'base64-encoder',
        input_text: 'Hello Qofeno',
        mode: 'encode'
      }
    },
    {
      slug: 'word-counter',
      funcId: 'qofeno-text',
      payload: {
        tool: 'word-counter',
        input_text: 'Qofeno is a powerful suite of online tools built by Mohd Zaheer Uddin.'
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of testSuite) {
    const start = Date.now();
    try {
      const execution = await functions.createExecution(test.funcId, JSON.stringify(test.payload));
      const elapsed = Date.now() - start;

      let resultObj = null;
      try {
        resultObj = JSON.parse(execution.responseBody);
      } catch (e) {
        resultObj = { raw: execution.responseBody };
      }

      if (execution.status === 'completed' && resultObj?.success !== false) {
        console.log(`✅ PASS  ${test.slug.padEnd(24)} ${elapsed}ms  output: ${resultObj?.download_url || resultObj?.result || 'OK'}`);
        passed++;
      } else {
        console.error(`❌ FAIL  ${test.slug.padEnd(24)} ${elapsed}ms  error: ${resultObj?.error || execution.errors || 'Execution failed'}`);
        failed++;
      }
    } catch (err) {
      console.error(`❌ FAIL  ${test.slug.padEnd(24)} ${Date.now() - start}ms  exception: ${err.message}`);
      failed++;
    }
  }

  // Cleanup test file
  if (uploadedFileId) {
    try {
      await storage.deleteFile(bucketInputs, uploadedFileId);
    } catch (_) {}
  }

  console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
}

runTests().catch(console.error);
