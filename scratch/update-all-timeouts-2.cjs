const { Client, Functions, Query } = require('node-appwrite');
require('dotenv').config();
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const func = new Functions(client);

async function updateAllTimeouts() {
  let allFuncs = [];
  let offset = 0;
  while (true) {
    try {
      const res = await func.list([Query.limit(100), Query.offset(offset)]);
      if (res.functions.length === 0) break;
      allFuncs.push(...res.functions);
      offset += res.functions.length;
    } catch(e) { console.error(e); break; }
  }
  
  console.log(`Found ${allFuncs.length} functions.`);
  let count = 0;
  for (const f of allFuncs) {
    if (f.timeout !== 900) {
      try {
        await func.update(f.$id, f.name, f.runtime, f.execute, f.events, f.schedule, 900, f.enabled, f.logging);
        console.log(`Updated timeout for ${f.name} (${f.$id}) to 900s`);
        count++;
      } catch (err) {
        console.error(`Failed to update ${f.name}:`, err.message);
      }
    }
  }
  console.log(`Successfully updated timeouts for ${count} functions.`);
}
updateAllTimeouts().catch(console.error);
