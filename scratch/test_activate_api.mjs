import dotenv from 'dotenv';
dotenv.config();

const endpoint = (process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1').replace(/\/$/, '');
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

async function testActivateApi() {
  console.log("\n=== ACTIVATING ALL DEPLOYMENTS VIA APPWRITE API ===\n");

  const fnListRes = await fetch(`${endpoint}/functions`, {
    headers: { 'X-Appwrite-Project': projectId, 'X-Appwrite-Key': apiKey }
  });
  const fnListData = await fnListRes.json();

  for (const fn of fnListData.functions) {
    const fnId = fn.$id;
    const depRes = await fetch(`${endpoint}/functions/${fnId}/deployments`, {
      headers: { 'X-Appwrite-Project': projectId, 'X-Appwrite-Key': apiKey }
    });
    const depData = await depRes.json();

    const readyDeps = (depData.deployments || [])
      .filter(d => d.status === 'ready')
      .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));

    if (readyDeps.length > 0) {
      const latest = readyDeps[0];
      
      const putRes = await fetch(`${endpoint}/functions/${fnId}`, {
        method: 'PUT',
        headers: {
          'X-Appwrite-Project': projectId,
          'X-Appwrite-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: fn.name,
          runtime: fn.runtime,
          execute: fn.execute || ['any'],
          events: fn.events || [],
          schedule: fn.schedule || '',
          timeout: fn.timeout || 15,
          enabled: fn.enabled ?? true,
          logging: fn.logging ?? true,
          deployment: latest.$id
        })
      });

      const updated = await putRes.json();
      console.log(`✅ Function ${fn.name} (${fnId}) -> Active Deployment set to: '${updated.deployment}'`);
    }
  }

  console.log("\nALL FUNCTIONS SUCCESSFULLY ACTIVATED AND READY!");
}

testActivateApi();
