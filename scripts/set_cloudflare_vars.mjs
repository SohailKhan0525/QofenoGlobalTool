import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_KEY;
const projectName = process.env.CLOUDFLARE_PAGES_PROJECT || 'qofeno-labs';

async function updatePagesEnv() {
  console.log(`Setting Cloudflare Pages environment variables for project '${projectName}'...`);
  
  const azureUrl = process.env.AZURE_PROCESSOR_URL || 'https://qofeno-processor.gentleforest-5357c740.centralindia.azurecontainerapps.io';

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      deployment_configs: {
        production: {
          env_vars: {
            AZURE_PROCESSOR_URL: { value: azureUrl },
            VITE_AZURE_PROCESSOR_URL: { value: azureUrl },
            VITE_APPWRITE_ENDPOINT: { value: process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1' },
            VITE_APPWRITE_PROJECT_ID: { value: process.env.VITE_APPWRITE_PROJECT_ID || '69c58725000ef2b43f18' }
          }
        }
      }
    })
  });

  const json = await res.json();
  if (json.success) {
    console.log('✅ Successfully updated Cloudflare Pages production environment variables!');
  } else {
    console.log('Cloudflare API response:', JSON.stringify(json.errors || json));
  }
}

updatePagesEnv().catch(console.error);
