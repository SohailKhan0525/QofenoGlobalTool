import fs from 'fs';
import path from 'path';
import { Client, Functions } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
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
  const functionsDir = path.resolve('functions');

  if (!fs.existsSync(functionsDir)) {
    throw new Error('functions/ directory does not exist');
  }

  const dirs = fs.readdirSync(functionsDir).filter(f => {
    const fullPath = path.join(functionsDir, f);
    return fs.statSync(fullPath).isDirectory() && !f.startsWith('_') && fs.existsSync(path.join(fullPath, 'src', 'main.js'));
  });

  console.log(`Found ${dirs.length} grouped functions to deploy:`, dirs);

  const tar = await import('tar');
  const { InputFile } = await import('node-appwrite/file');

  for (const dirName of dirs) {
    const fullDir = path.join(functionsDir, dirName);
    console.log(`\n=== Deploying Grouped Function: ${dirName} ===`);

    try {
      const tarPath = path.join(fullDir, 'code.tar.gz');
      if (fs.existsSync(tarPath)) fs.unlinkSync(tarPath);

      const filesToTar = [];
      if (fs.existsSync(path.join(fullDir, 'package.json'))) filesToTar.push('package.json');
      if (fs.existsSync(path.join(fullDir, 'src'))) filesToTar.push('src');
      if (fs.existsSync(path.join(fullDir, 'Dockerfile'))) filesToTar.push('Dockerfile');

      // Create archive
      await tar.c(
        {
          gzip: true,
          file: tarPath,
          cwd: fullDir
        },
        filesToTar
      );

      console.log(`  ✓ Created code.tar.gz archive.`);

      // Upload deployment with retries for rate limits
      let deployed = false;
      let deployRetries = 5;
      while (deployRetries > 0 && !deployed) {
        try {
          const deployment = await functionsApi.createDeployment(
            dirName, // functionId matches directory name
            InputFile.fromPath(tarPath, 'code.tar.gz'),
            true, // activate immediately
            'src/main.js',
            'npm install'
          );
          console.log(`  [SUCCESS] Deployment ID: ${deployment.$id} activated immediately.`);
          deployed = true;
        } catch (depErr) {
          if (depErr.code === 429) {
            console.log(`  [RATE LIMIT] Retrying in 12s...`);
            await sleep(12000);
            deployRetries--;
          } else {
            console.error(`  [ERROR] Deployment failed for ${dirName}: ${depErr.message}`);
            deployRetries = 0;
          }
        }
      }

      if (fs.existsSync(tarPath)) fs.unlinkSync(tarPath);
      await sleep(2000); // 2 seconds cooldown
    } catch (err) {
      console.error(`  [EXCEPTION] Failed to process ${dirName}: ${err.message}`);
    }
  }

  console.log('\nAll grouped function deployments completed!');
}

main().catch(console.error);
