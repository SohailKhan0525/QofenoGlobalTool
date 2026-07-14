import fs from 'fs';
import path from 'path';
import { Client, Functions, Query } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('69c58725000ef2b43f18')
  .setKey('standard_de2628e1d388cc087d06c18709188fbba1f70ad9fb89ebb5a629d99a50b5d982c0039ecee34d13c38cf6d9376cc2076c7f38f501b5c235c9ca459dfbbe38a1a715c8fb85bf86405c1e6c322e4f6b8ceb70055f3bf146cf8cb4c8cc6d66e5747d5a8b6c6a28c070f658cd50e0a4caeddf59e59f10889149c0d32ad79457d46998');

const functions = new Functions(client);

async function main() {
  try {
    console.log('Fetching all existing functions from Appwrite...');
    const allFunctions = [];
    let offset = 0;
    while (true) {
      const response = await functions.list([Query.limit(100), Query.offset(offset)]);
      allFunctions.push(...response.functions);
      if (allFunctions.length >= response.total) break;
      offset += 100;
    }
    console.log(`Successfully fetched ${allFunctions.length} functions.`);

    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    allFunctions.forEach(fn => {
      const envKey = `VITE_APPWRITE_FUNCTION_${fn.name.toUpperCase().replace(/-/g, '_')}_ID`;
      const regex = new RegExp(`^${envKey}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${envKey}=${fn.$id}`);
      } else {
        envContent += `\n${envKey}=${fn.$id}`;
      }
    });

    fs.writeFileSync(envPath, envContent);
    console.log('Successfully updated .env file with all current Appwrite functions.');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
