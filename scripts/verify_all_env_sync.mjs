import { Client, Functions } from 'node-appwrite';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const targetFns = [
  'qofeno-pdf', 'qofeno-image', 'qofeno-video', 'qofeno-audio',
  'qofeno-text', 'qofeno-developer', 'qofeno-data', 'qofeno-security',
  'azure-manager', 'azure-cost-monitor'
];

async function verifyAll() {
  console.log('=== Checking Appwrite Function Environment Variables ===');
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const functions = new Functions(client);

  for (const fid of targetFns) {
    try {
      const list = await functions.listVariables(fid);
      const urlVar = list.variables.find(v => v.key === 'AZURE_PROCESSOR_URL');
      const secretVar = list.variables.find(v => v.key === 'QOFENO_CONTAINER_SECRET');
      console.log(`  ✓ ${fid.padEnd(20)}: AZURE_PROCESSOR_URL=${urlVar ? 'OK' : 'MISSING'}, QOFENO_CONTAINER_SECRET=${secretVar ? 'OK' : 'MISSING'}`);
    } catch (err) {
      console.error(`  ✗ ${fid}: ${err.message}`);
    }
  }

  console.log('\n=== Checking Azure Processor Health Endpoint ===');
  const azureUrl = process.env.AZURE_PROCESSOR_URL;
  const secret = process.env.QOFENO_CONTAINER_SECRET;
  try {
    const res = await fetch(`${azureUrl}/health`, {
      headers: { 'Authorization': `Bearer ${secret}` },
      timeout: 5000
    });
    const data = await res.json();
    console.log(`  ✓ Azure Container Health (${azureUrl}): Status ${res.status}`, data);
  } catch (err) {
    console.error(`  ✗ Azure Health check failed: ${err.message}`);
  }
}

verifyAll().catch(console.error);
