import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function checkCloudflareEnvs() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_KEY;
  const projectName = process.env.CLOUDFLARE_PAGES_PROJECT || 'qofeno-labs';

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`, {
    headers: { 'Authorization': `Bearer ${apiToken}` }
  });
  const data = await res.json();
  console.log('CLOUDFLARE PAGES ENVS:', JSON.stringify(data.result?.deployment_configs, null, 2));
}

checkCloudflareEnvs().catch(console.error);
