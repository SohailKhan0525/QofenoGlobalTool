import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, Functions, ID } from 'node-appwrite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env
const envPath = path.resolve(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const match = trimmed.match(/^(\w+)=(.*)$/);
  if (match) {
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '').trim();
  }
}

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const functionsApi = new Functions(client);

const REQUIRED_ENV_VARS = {
  APPWRITE_ENDPOINT: process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
  APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
  DATABASE_ID: process.env.DATABASE_ID || 'qofeno_db',
  BUCKET_INPUTS: process.env.BUCKET_INPUTS || 'tool_inputs',
  BUCKET_OUTPUTS: process.env.BUCKET_OUTPUTS || 'tool_outputs',
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function setEnvVarsForFunction(functionId, baseName) {
  try {
    // Get existing variables
    let existing = { variables: [] };
    try {
      existing = await functionsApi.listVariables({ functionId });
    } catch (e) {
      if (e.code === 404) {
        console.log(`  [SKIP] Function ${functionId} not found in Appwrite`);
        return false;
      }
      throw e;
    }

    const existingVars = {};
    existing.variables.forEach(v => {
      existingVars[v.key] = v.$id;
    });

    for (const [key, value] of Object.entries(REQUIRED_ENV_VARS)) {
      if (!value) continue;
      
      const varId = existingVars[key];
      let attempts = 3;
      let setSuccess = false;
      
      while (attempts > 0 && !setSuccess) {
        try {
          if (varId) {
            // Update
            await functionsApi.updateVariable({
              functionId,
              variableId: varId,
              key,
              value
            });
          } else {
            // Create
            await functionsApi.createVariable({
              functionId,
              variableId: ID.unique(),
              key,
              value
            });
          }
          setSuccess = true;
        } catch (err) {
          if (err.code === 429) {
            console.log(`  [RATE LIMIT] Setting ${key} for ${baseName}. Waiting 15s...`);
            await sleep(15000);
            attempts--;
          } else {
            console.error(`  [ERROR] Failed to set ${key} for ${baseName}: ${err.message}`);
            attempts = 0;
          }
        }
      }
      
      await sleep(100);
    }
    
    console.log(`  [SUCCESS] Set variables on ${baseName} (${functionId})`);
    return true;
  } catch (err) {
    console.error(`  [EXCEPTION] Failed setting vars on ${baseName} (${functionId}): ${err.message}`);
    return false;
  }
}

async function main() {
  const toolsDir = path.resolve(__dirname, '..', 'appwrite-functions', 'tools');
  const otherFunctionsDir = path.resolve(__dirname, '..', 'appwrite-functions');

  const toolsDirs = fs.existsSync(toolsDir) ? fs.readdirSync(toolsDir).map(f => path.join('appwrite-functions', 'tools', f)) : [];
  const rootDirs = fs.readdirSync(otherFunctionsDir).filter(f => f !== 'tools').map(f => path.join('appwrite-functions', f));
  
  const allDirs = [...toolsDirs, ...rootDirs].filter(d => {
    const fullPath = path.resolve(__dirname, '..', d);
    const baseName = path.basename(d);
    return !baseName.startsWith('_') && fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'src', 'main.js'));
  });

  console.log(`Found ${allDirs.length} local functions to configure.`);

  for (const dir of allDirs) {
    const baseName = path.basename(dir);
    
    // Find mapped ID
    const envKeyName = baseName.toUpperCase().replace(/-/g, '_');
    const envKeysToTry = [
      `VITE_APPWRITE_FUNCTION_${envKeyName}_ID`,
      `NEXT_PUBLIC_APPWRITE_FUNCTION_${envKeyName}_ID`
    ];
    let mappedId = null;
    for (const key of envKeysToTry) {
      if (process.env[key] && process.env[key] !== baseName) {
        mappedId = process.env[key];
        break;
      }
    }
    const functionId = mappedId || baseName;

    console.log(`Configuring environment variables for ${baseName} (${functionId})...`);
    await setEnvVarsForFunction(functionId, baseName);
    
    // Safety sleep between functions
    await sleep(400);
  }

  console.log('Finished updating all functions environment variables.');
}

main().catch(console.error);
