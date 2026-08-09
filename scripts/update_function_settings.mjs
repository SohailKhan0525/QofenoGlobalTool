import { Client, Functions } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '69c58725000ef2b43f18')
  .setKey(process.env.APPWRITE_API_KEY || process.env.APPWRITE_SECRET_KEY || 'standard_de2628e1d388cc087d06c18709188fbba1f70ad9fb89ebb5a629d99a50b5d982c0039ecee34d13c38cf6d9376cc2076c7f38f501b5c235c9ca459dfbbe38a1a715c8fb85bf86405c1e6c322e4f6b8ceb70055f3bf146cf8cb4c8cc6d66e5747d5a8b6c6a28c070f658cd50e0a4caeddf59e59f10889149c0d32ad79457d46998');

const functions = new Functions(client);

const fnIds = [
  'qofeno-pdf',
  'qofeno-image',
  'qofeno-video',
  'qofeno-audio',
  'qofeno-text',
  'qofeno-developer',
  'qofeno-data',
  'qofeno-security'
];

async function updateLimits() {
  console.log('Checking & updating Appwrite function settings...');
  for (const id of fnIds) {
    try {
      const fn = await functions.get(id);
      console.log(`\nFunction [${id}]:`);
      console.log(`  Name: ${fn.name}`);
      console.log(`  Runtime: ${fn.runtime}`);
      console.log(`  Timeout: ${fn.timeout}s`);
      console.log(`  Schedule: ${fn.schedule || 'None'}`);

      // Try updating timeout to max (900 seconds or 300 seconds)
      const updated = await functions.update(
        id,
        fn.name,
        fn.runtime,
        fn.execute,
        fn.events,
        fn.schedule,
        300 // Set 300 seconds timeout limit
      );
      console.log(`  => Updated Timeout to: ${updated.timeout}s`);
    } catch (err) {
      console.log(`  Error on ${id}: ${err.message}`);
    }
  }
}

updateLimits().catch(console.error);
