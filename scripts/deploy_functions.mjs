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
  const functionsDir = path.resolve(scriptDir, '..', 'functions', 'tools');
  const otherFunctionsDir = path.resolve(scriptDir, '..', 'functions');

  if (!fs.existsSync(functionsDir)) {
    console.log('No tools directory found, checking root functions...');
  }

  // Get all directories under functions/tools and functions/
  const toolsDirs = fs.existsSync(functionsDir) ? fs.readdirSync(functionsDir).map(f => path.join('functions', 'tools', f)) : [];
  const rootDirs = fs.readdirSync(otherFunctionsDir).filter(f => f !== 'tools').map(f => path.join('functions', f));
  
  const allDirs = [...toolsDirs, ...rootDirs].filter(d => {
    const fullPath = path.resolve(scriptDir, '..', d);
    const baseName = path.basename(d);
    return !baseName.startsWith('_') && fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'src', 'main.js'));
  });

  console.log(`Found ${allDirs.length} functions to deploy.`);

  for (const dir of allDirs) {
    const fullDir = path.resolve(scriptDir, '..', dir);
    const functionId = path.basename(dir);
    console.log(`\n--- Deploying ${functionId} ---`);

    try {
      // 1. Create or get function
      try {
        await functionsApi.get(functionId);
        console.log(`Function ${functionId} exists.`);
      } catch (err) {
        if (err.code === 404) {
          console.log(`Creating function ${functionId}...`);
          await functionsApi.create(
            functionId,
            functionId,
            'node-18.0',
            ['any'] // execute permissions
          );
        } else {
          throw err;
        }
      }

      // 2. Package the code into a tar.gz using native tar command or a simple node zip if tar is unavailable.
      const tarPath = path.join(fullDir, 'code.tar.gz');
      // Using powershell or bash to tar (we will use git bash or native windows tar)
      try {
        if (fs.existsSync(tarPath)) fs.unlinkSync(tarPath);
        // Windows 10+ has tar built-in
        execSync(`tar -czf code.tar.gz .`, { cwd: fullDir });
      } catch (e) {
        console.error(`Failed to tar directory ${fullDir}. Ensure 'tar' is available.`);
        console.error(e.message);
        continue;
      }

      // 3. Create deployment
      console.log(`Uploading deployment for ${functionId}...`);
      // Since node-appwrite expects an InputFile, and we are on Node, we use InputFile.fromPath
      const { InputFile } = await import('node-appwrite/file');
      const deployment = await functionsApi.createDeployment(
        functionId,
        'src/main.js',
        'npm install',
        InputFile.fromPath(tarPath, 'code.tar.gz'),
        true // activate immediately
      );
      
      console.log(`Successfully deployed ${functionId}. Deployment ID: ${deployment.$id}`);
      
      // Cleanup
      if (fs.existsSync(tarPath)) fs.unlinkSync(tarPath);

    } catch (err) {
      console.error(`Error deploying ${functionId}: ${err.message}`);
    }
  }
}

deployFunctions().catch(console.error);
