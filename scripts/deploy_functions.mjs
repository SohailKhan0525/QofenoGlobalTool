import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { Client, Functions } from 'node-appwrite';

function loadEnv() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.resolve(scriptDir, '..', '.env');
  if (!fs.existsSync(envPath)) throw new Error('.env file not found');

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(\w+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  }
}

async function deployFunctions() {
  loadEnv();
  const endpoint = process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!projectId || !apiKey) {
    throw new Error('APPWRITE_PROJECT_ID and APPWRITE_API_KEY must be set in .env');
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const functionsApi = new Functions(client);
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const functionsDir = path.resolve(scriptDir, '..', 'appwrite-functions', 'tools');
  const otherFunctionsDir = path.resolve(scriptDir, '..', 'appwrite-functions');

  if (!fs.existsSync(functionsDir)) {
    console.log('No tools directory found, checking root functions...');
  }

  // Get all directories under appwrite-functions/tools and appwrite-functions/
  const toolsDirs = fs.existsSync(functionsDir) ? fs.readdirSync(functionsDir).map(f => path.join('appwrite-functions', 'tools', f)) : [];
  const rootDirs = fs.readdirSync(otherFunctionsDir).filter(f => f !== 'tools').map(f => path.join('appwrite-functions', f));
  
  const allDirs = [...toolsDirs, ...rootDirs].filter(d => {
    const fullPath = path.resolve(scriptDir, '..', d);
    const baseName = path.basename(d);
    return !baseName.startsWith('_') && fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'src', 'main.js'));
  });

  console.log(`Found ${allDirs.length} functions to deploy.`);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  for (const dir of allDirs) {
    const fullDir = path.resolve(scriptDir, '..', dir);
    const baseName = path.basename(dir);
    // Find mapped ID in environment
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
    console.log(`\n--- Deploying ${baseName} (ID: ${functionId}) ---`);

    try {
      // 1. Create or get function with retry logic
      let functionExists = false;
      let retries = 10;
      while (retries > 0 && !functionExists) {
        try {
          await functionsApi.get(functionId);
          console.log(`Function ${functionId} exists.`);
          functionExists = true;
        } catch (err) {
          if (err.code === 404) {
            console.log(`Creating function ${functionId}...`);
            try {
              await functionsApi.create(functionId, baseName, 'node-18.0', ['any']);
              functionExists = true;
            } catch (createErr) {
              if (createErr.code === 429) {
                console.log('Rate limited on create. Waiting 30s...');
                await sleep(30000);
                retries--;
              } else {
                console.error(`Creation failed for ${functionId}: ${createErr.message}`);
                retries = 0; // exit loop
              }
            }
          } else if (err.code === 429) {
            console.log('Rate limited on get. Waiting 30s...');
            await sleep(30000);
            retries--;
          } else {
            console.error(`Get failed for ${functionId}: ${err.message}`);
            retries = 0;
          }
        }
      }

      if (!functionExists) {
        console.error(`Skipping deployment for ${functionId} because function creation/get failed.`);
        continue;
      }

      await sleep(2000); // 2 seconds wait to avoid rate limit between functions

      // 2. Package the code into a tar.gz using native node tar module
      const tarPath = path.join(fullDir, 'code.tar.gz');
      try {
        if (fs.existsSync(tarPath)) fs.unlinkSync(tarPath);
        const tar = await import('tar');
        
        // We only want to tar package.json and src/
        const filesToTar = [];
        if (fs.existsSync(path.join(fullDir, 'package.json'))) filesToTar.push('package.json');
        if (fs.existsSync(path.join(fullDir, 'src'))) filesToTar.push('src');
        
        await tar.c(
          {
            gzip: true,
            file: tarPath,
            cwd: fullDir
          },
          filesToTar
        );
      } catch (e) {
        console.error(`Failed to tar directory ${fullDir}.`);
        console.error(e.message);
        continue;
      }

      // 3. Create deployment
      console.log(`Uploading deployment for ${functionId}...`);
      const { InputFile } = await import('node-appwrite/file');
      
      let deployed = false;
      let deployRetries = 3;
      while (deployRetries > 0 && !deployed) {
        try {
          const deployment = await functionsApi.createDeployment(
            functionId,
            InputFile.fromPath(tarPath, 'code.tar.gz'),
            true, // activate immediately
            'src/main.js',
            'npm install'
          );
          console.log(`Successfully deployed ${functionId}. Deployment ID: ${deployment.$id}`);
          deployed = true;
        } catch (depErr) {
          if (depErr.code === 429) {
            console.log('Rate limited on createDeployment. Waiting 15s...');
            await sleep(15000);
            deployRetries--;
          } else {
            throw depErr;
          }
        }
      }
      
      // Cleanup
      if (fs.existsSync(tarPath)) fs.unlinkSync(tarPath);

    } catch (err) {
      console.error(`Error deploying ${functionId}: ${err.message}`);
    }
  }
}

deployFunctions().catch(console.error);
