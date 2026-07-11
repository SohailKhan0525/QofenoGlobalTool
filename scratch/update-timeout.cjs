const { Client, Functions } = require('node-appwrite');
require('dotenv').config();
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const func = new Functions(client);

async function updateTimeout() {
  const f = await func.get('aac-converter');
  await func.update('aac-converter', f.name, f.runtime, f.execute, f.events, f.schedule, 900, f.enabled, f.logging);
  const updated = await func.get('aac-converter');
  console.log('New timeout:', updated.timeout);
}
updateTimeout().catch(console.error);
