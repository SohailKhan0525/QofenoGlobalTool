import { Client, Functions } from 'node-appwrite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function loadEnv() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.resolve(scriptDir, '..', '.env');
  if (!fs.existsSync(envPath)) throw new Error('.env file not found');

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(\w+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  }
}

async function testTools() {
  loadEnv();
  const endpoint = process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!projectId || !apiKey) {
    throw new Error('Missing Appwrite Config');
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const functions = new Functions(client);

  console.log('--- Running Qofeno Automated Test Suite ---');
  
  const results = [];
  
  // 1. Test json-formatter (Simplest, doesn't require binary payloads)
  console.log('\nTesting json-formatter...');
  try {
    const jsonPayload = {
      json: '{"test":"value", "dirty":  true}',
      action: 'format'
    };
    
    const exec = await functions.createExecution('json-formatter', JSON.stringify(jsonPayload), false);
    const resp = JSON.parse(exec.responseBody || '{}');
    
    if (resp.success && resp.result) {
      console.log('✅ json-formatter passed');
      results.push({ tool: 'json-formatter', status: 'PASS' });
    } else {
      console.error('❌ json-formatter failed:', resp.error || resp);
      results.push({ tool: 'json-formatter', status: 'FAIL' });
    }
  } catch (e) {
    console.error('❌ json-formatter exception:', e.message);
    results.push({ tool: 'json-formatter', status: 'FAIL' });
  }

  // 2. Test word-counter
  console.log('\nTesting word-counter...');
  try {
    const wordPayload = {
      text: 'Hello world this is a test payload for the word counter.'
    };
    
    const exec = await functions.createExecution('word-counter', JSON.stringify(wordPayload), false);
    const resp = JSON.parse(exec.responseBody || '{}');
    
    if (resp.success && resp.result?.words === 11) {
      console.log('✅ word-counter passed');
      results.push({ tool: 'word-counter', status: 'PASS' });
    } else {
      console.error('❌ word-counter failed:', resp.error || resp);
      results.push({ tool: 'word-counter', status: 'FAIL' });
    }
  } catch (e) {
    console.error('❌ word-counter exception:', e.message);
    results.push({ tool: 'word-counter', status: 'FAIL' });
  }

  // 3. Test base64-encoder
  console.log('\nTesting base64-encoder...');
  try {
    const b64Payload = {
      text: 'qofeno',
      action: 'encode'
    };
    
    const exec = await functions.createExecution('base64-encoder', JSON.stringify(b64Payload), false);
    const resp = JSON.parse(exec.responseBody || '{}');
    
    if (resp.success && resp.result === 'cW9mZW5v') {
      console.log('✅ base64-encoder passed');
      results.push({ tool: 'base64-encoder', status: 'PASS' });
    } else {
      console.error('❌ base64-encoder failed:', resp.error || resp);
      results.push({ tool: 'base64-encoder', status: 'FAIL' });
    }
  } catch (e) {
    console.error('❌ base64-encoder exception:', e.message);
    results.push({ tool: 'base64-encoder', status: 'FAIL' });
  }

  console.log('\n================================');
  console.log('Test Summary:');
  results.forEach(r => {
    console.log(`${r.status === 'PASS' ? '✅' : '❌'} ${r.tool}`);
  });
  
  const passed = results.filter(r => r.status === 'PASS').length;
  console.log(`\nScore: ${passed}/${results.length} tests passed.`);
  
  if (passed !== results.length) {
    process.exit(1);
  }
}

testTools().catch(console.error);
