import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

  // Get all directories under appwrite-functions/tools and appwrite-functions/
  const toolsDirs = fs.existsSync(functionsDir) ? fs.readdirSync(functionsDir).map(f => path.join('appwrite-functions', 'tools', f)) : [];
  const rootDirs = fs.readdirSync(otherFunctionsDir).filter(f => f !== 'tools').map(f => path.join('appwrite-functions', f));
  
  const allDirs = [...toolsDirs, ...rootDirs].filter(d => {
    const fullPath = path.resolve(scriptDir, '..', d);
    const baseName = path.basename(d);
    return !baseName.startsWith('_') && fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'src', 'main.js'));
  });

  console.log(`Found ${allDirs.length} functions to deploy.`);

  // Setup dynamic tar module import
  const tar = await import('tar');
  const { InputFile } = await import('node-appwrite/file');

  // Batch execution of 12 parallel deployments at a time
  const batchSize = 12;
  for (let i = 0; i < allDirs.length; i += batchSize) {
    const batch = allDirs.slice(i, i + batchSize);
    console.log(`\n=== Deploying Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allDirs.length / batchSize)} (${batch.length} functions) ===`);

    await Promise.all(batch.map(async (dir) => {
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

      try {
        // 1. Package the code into a tar.gz using native node tar module
        const tarPath = path.join(fullDir, 'code.tar.gz');
        if (fs.existsSync(tarPath)) fs.unlinkSync(tarPath);
        
        const filesToTar = [];
        if (fs.existsSync(path.join(fullDir, 'package.json'))) filesToTar.push('package.json');
        if (fs.existsSync(path.join(fullDir, 'src'))) filesToTar.push('src');
        if (fs.existsSync(path.join(fullDir, 'Dockerfile'))) filesToTar.push('Dockerfile'); // Include Dockerfile!

        await tar.c(
          {
            gzip: true,
            file: tarPath,
            cwd: fullDir
          },
          filesToTar
        );

        // 2. Upload deployment with retries for rate limits
        let deployed = false;
        let deployRetries = 6;
        while (deployRetries > 0 && !deployed) {
          try {
            const deployment = await functionsApi.createDeployment(
              functionId,
              InputFile.fromPath(tarPath, 'code.tar.gz'),
              true, // activate immediately
              'src/main.js',
              'npm install'
            );
            console.log(`[SUCCESS] Deployed ${baseName} (${functionId}). Deployment ID: ${deployment.$id}`);
            deployed = true;
          } catch (depErr) {
            if (depErr.code === 429) {
              console.log(`[RATE LIMIT] ${baseName} (${functionId}). Retrying in 12s...`);
              await sleep(12000);
              deployRetries--;
            } else {
              console.error(`[ERROR] Failed deployment for ${baseName}: ${depErr.message}`);
              deployRetries = 0; // stop retrying
            }
          }
        }

        // Cleanup tar
        if (fs.existsSync(tarPath)) fs.unlinkSync(tarPath);
      } catch (err) {
        console.error(`[EXCEPTION] ${baseName} failed: ${err.message}`);
      }
    }));

    await sleep(2000); // Wait 2s between batches to cool down Appwrite rate limits
  }

  console.log('\nAll function deployments finished!');
}

deployFunctions().catch(console.error);
