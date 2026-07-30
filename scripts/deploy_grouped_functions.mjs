import fs from 'fs';
import path from 'path';
import * as tar from 'tar';
import { Client, Functions } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '69c58725000ef2b43f18')
  .setKey(process.env.APPWRITE_API_KEY || process.env.APPWRITE_SECRET_KEY || 'standard_de2628e1d388cc087d06c18709188fbba1f70ad9fb89ebb5a629d99a50b5d982c0039ecee34d13c38cf6d9376cc2076c7f38f501b5c235c9ca459dfbbe38a1a715c8fb85bf86405c1e6c322e4f6b8ceb70055f3bf146cf8cb4c8cc6d66e5747d5a8b6c6a28c070f658cd50e0a4caeddf59e59f10889149c0d32ad79457d46998');

const functions = new Functions(client);

const groupedFunctions = [
  { name: 'qofeno-pdf', funcId: 'qofeno-pdf' },
  { name: 'qofeno-image', funcId: 'qofeno-image' },
  { name: 'qofeno-video', funcId: 'qofeno-video' },
  { name: 'qofeno-audio', funcId: 'qofeno-audio' },
  { name: 'qofeno-text', funcId: 'qofeno-text' },
  { name: 'qofeno-developer', funcId: 'qofeno-developer' },
  { name: 'qofeno-data', funcId: 'qofeno-data' },
  { name: 'qofeno-security', funcId: 'qofeno-security' }
];

async function deployGrouped() {
  console.log(`Deploying ${groupedFunctions.length} grouped Appwrite functions...`);

  for (const item of groupedFunctions) {
    const dirPath = path.join(process.cwd(), 'functions', item.name);
    const tarPath = path.join(process.cwd(), 'functions', `${item.name}.tar.gz`);

    if (!fs.existsSync(dirPath)) {
      console.warn(`[SKIP] Directory ${dirPath} does not exist.`);
      continue;
    }

    try {
      console.log(`[PACKAGING] ${item.name}...`);
      await tar.c(
        {
          gzip: true,
          file: tarPath,
          cwd: dirPath
        },
        ['.']
      );

      console.log(`[UPLOADING] ${item.name} (ID: ${item.funcId})...`);
      const file = InputFile.fromPath(tarPath, 'code.tar.gz');
      const deployment = await functions.createDeployment({
        functionId: item.funcId,
        code: file,
        activate: true,
        entrypoint: 'src/main.js',
        commands: 'npm install --production'
      });

      console.log(`[SUCCESS] Deployed ${item.name} (ID: ${item.funcId}). Deployment ID: ${deployment.$id}`);
    } catch (err) {
      console.error(`[ERROR] Failed to deploy ${item.name}: ${err.message}`);
    } finally {
      if (fs.existsSync(tarPath)) {
        fs.unlinkSync(tarPath);
      }
    }
  }
}

deployGrouped().catch(console.error);
