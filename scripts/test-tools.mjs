import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, Functions } from 'node-appwrite';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^(\w+)=(.*)$/);
      if (match) process.env[match[1]] = match[2];
    }
  }
}

// Stubs for testing file upload triggers
const dummyPdf = 'JVBERi0xLjQKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nCiAgICAgL1BhZ2VzIDIgMCBSCiAgPj4KZW5kb2JqCjIgMCBvYmoKICA8PCAvVHlwZSAvUGFnZXMKICAgICAvS2lkcyBbIDMgMCBSIF0KICAgICAvQ291bnQgMQogID4+CmVuZG9iagozIDAgb2JqCiAgPDwgL1R5cGUgL1BhZ2UKICAgICAvUGFyZW50IDIgMCBSCiAgICAgL01lZGlhQm94IFsgMCAwIDYwMCA0MDAgXQogID4+CmVuZG9iagp0cmFpbGVyCiAgPDwgL1NpemUgNAogICAgIC9Sb290IDEgMCBSCiAgPj4KJSVFT0Y=';
const dummyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const dummyWav = 'UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
const dummyMp4 = 'AAAAGGZ0eXBtcDQyAAAAAG1wNDJpc29tAAAAKHV1aWR4PVNDUkVFTlJFQ09SRElORzIwMTUwNjEyMCAwMDAwMDAwAAAAOG1kYXQ=';

async function main() {
  loadEnv();
  const endpoint = process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!projectId || !apiKey) {
    console.error("❌ APPWRITE_PROJECT_ID and APPWRITE_API_KEY must be configured in .env");
    process.exit(1);
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const functions = new Functions(client);

  const toolsDir = path.join(process.cwd(), 'appwrite-functions', 'tools');
  const dirs = fs.readdirSync(toolsDir).filter(f => fs.statSync(path.join(toolsDir, f)).isDirectory());

  console.log(`\n=== Starting E2E smoke tests for ${dirs.length} tools ===\n`);

  for (const slug of dirs) {
    const envKey = 'VITE_APPWRITE_FUNCTION_' + slug.toUpperCase().replace(/-/g, '_') + '_ID';
    const functionId = process.env[envKey] || slug;

    // Build dummy test payload
    let payload = {};
    if (slug === 'json-formatter') {
      payload = { json: '{"test":true}', action: 'format' };
    } else if (slug === 'base64-encoder') {
      payload = { text: 'hello', action: 'encode' };
    } else if (slug === 'text-case-converter') {
      payload = { text: 'hello', target_case: 'upper' };
    } else if (slug === 'word-counter') {
      payload = { text: 'hello world from smoke test' };
    } else if (slug.includes('pdf') || slug.includes('word') || slug.includes('excel') || slug.includes('powerpoint')) {
      payload = { file_base64: dummyPdf, filename: 'test.pdf' };
    } else if (slug.includes('video') || slug.includes('mp4') || slug.includes('mov') || slug.includes('avi') || slug.includes('webm')) {
      payload = { file_base64: dummyMp4, filename: 'test.mp4' };
    } else if (slug.includes('image') || slug.includes('jpg') || slug.includes('png') || slug.includes('webp') || slug.includes('gif')) {
      payload = { file_base64: dummyPng, filename: 'test.png' };
    } else if (slug.includes('audio') || slug.includes('mp3') || slug.includes('wav') || slug.includes('ogg') || slug.includes('flac') || slug.includes('aac')) {
      payload = { file_base64: dummyWav, filename: 'test.wav' };
    } else {
      payload = { file_base64: dummyPdf, filename: 'test.pdf' };
    }

    try {
      const execution = await functions.createExecution(functionId, JSON.stringify(payload), false);
      const resBody = JSON.parse(execution.responseBody || '{}');
      if (execution.status === 'completed' && resBody.success !== false) {
        console.log(`✅ [${slug}] - SUCCESS (Duration: ${execution.duration}s)`);
      } else {
        console.error(`❌ [${slug}] - FAILED (Status: ${execution.status}, Error: ${resBody.error || 'Unknown error'})`);
      }
    } catch (err) {
      console.error(`❌ [${slug}] - ERROR: ${err.message}`);
    }

    // Wait a bit to avoid hitting rate limits on the Appwrite API
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log("\n=== E2E Smoke Tests Finished ===");
}

main().catch(console.error);
