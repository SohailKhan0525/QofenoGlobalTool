import fs from 'fs';
import path from 'path';
import { Client, Functions, Query, ID } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('69c58725000ef2b43f18')
  .setKey('standard_de2628e1d388cc087d06c18709188fbba1f70ad9fb89ebb5a629d99a50b5d982c0039ecee34d13c38cf6d9376cc2076c7f38f501b5c235c9ca459dfbbe38a1a715c8fb85bf86405c1e6c322e4f6b8ceb70055f3bf146cf8cb4c8cc6d66e5747d5a8b6c6a28c070f658cd50e0a4caeddf59e59f10889149c0d32ad79457d46998');

const functions = new Functions(client);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  try {
    console.log('Fetching existing functions from Appwrite...');
    const allFunctions = [];
    let offset = 0;
    while (true) {
      const response = await functions.list([Query.limit(100), Query.offset(offset)]);
      allFunctions.push(...response.functions);
      if (allFunctions.length >= response.total) break;
      offset += 100;
    }
    
    console.log(`Found ${allFunctions.length} existing functions in Appwrite.`);
    const existingMap = {};
    allFunctions.forEach(fn => {
      existingMap[fn.name] = fn.$id;
    });

    const toolsDir = path.join(process.cwd(), 'appwrite-functions', 'tools');
    const localTools = fs.readdirSync(toolsDir).filter(f => fs.statSync(path.join(toolsDir, f)).isDirectory());
    
    console.log(`Total local tool folders to sync: ${localTools.length}`);

    const envPath = path.join(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');

    // Run sequentially (one by one) to avoid hitting Appwrite API rate limits
    let processed = 0;
    let rateLimitHits = 0;
    for (const toolName of localTools) {
      processed++;
      let funcId = existingMap[toolName] || existingMap[`tools-${toolName}`];
      
      if (!funcId) {
        let created = false;
        let attempt = 1;
        while (!created) {
          try {
            console.log(`[${processed}/${localTools.length}] Creating function for ${toolName} (Attempt ${attempt})...`);
            const newFunc = await functions.create(
              ID.unique(),
              toolName,
              'node-18.0',
              ['any'],
              [], // events
              '', // schedule
              900, // timeout
              true // enabled
            );
            funcId = newFunc.$id;
            console.log(`[${processed}/${localTools.length}] Successfully created ${toolName} with ID: ${funcId}`);
            created = true;
            rateLimitHits = 0; // reset consecutive rate limits
            
            // Wait 3.5s after a successful creation to cool down rate limit
            await sleep(3500);
          } catch (e) {
            if (e.code === 429) {
              rateLimitHits++;
              if (rateLimitHits >= 3) {
                console.log(`\n[WARNING] Appwrite daily creation rate limit reached at [${toolName}]. Gracefully exiting function creation stage...`);
                fs.writeFileSync(envPath, envContent);
                process.exit(0);
              }
              console.log(`[${processed}/${localTools.length}] Rate limited. Waiting 50 seconds before retry...`);
              await sleep(50000);
              attempt++;
            } else {
              console.error(`[${processed}/${localTools.length}] Error: ${e.message}`);
              break; // exit loop on non-rate-limit errors
            }
          }
        }
      } else {
        // Already exists, just make sure env var is set
        // console.log(`[${processed}/${localTools.length}] ${toolName} already exists with ID: ${funcId}`);
      }
      
      if (funcId) {
        const envKey = `VITE_APPWRITE_FUNCTION_${toolName.toUpperCase().replace(/-/g, '_')}_ID`;
        const regex = new RegExp(`^${envKey}=.*$`, 'm');
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${envKey}=${funcId}`);
        } else {
          envContent += `\n${envKey}=${funcId}`;
        }
      }
      
      // Wait 100ms between loop iterations for safety
      await sleep(100);
    }

    fs.writeFileSync(envPath, envContent);
    console.log('Finished updating .env with all function IDs.');
  } catch (error) {
    console.error('Error in main:', error);
  }
}

main();
