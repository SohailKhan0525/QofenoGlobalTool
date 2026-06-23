import fs from 'fs';
import path from 'path';
import * as tar from 'tar';
import { Client, Functions } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('69c58725000ef2b43f18')
  .setKey('standard_de2628e1d388cc087d06c18709188fbba1f70ad9fb89ebb5a629d99a50b5d982c0039ecee34d13c38cf6d9376cc2076c7f38f501b5c235c9ca459dfbbe38a1a715c8fb85bf86405c1e6c322e4f6b8ceb70055f3bf146cf8cb4c8cc6d66e5747d5a8b6c6a28c070f658cd50e0a4caeddf59e59f10889149c0d32ad79457d46998');

const functions = new Functions(client);

async function main() {
  const toolsDir = path.join(process.cwd(), 'appwrite-functions', 'tools');
  const localTools = fs.readdirSync(toolsDir).filter(f => fs.statSync(path.join(toolsDir, f)).isDirectory());

  for (const toolName of localTools) {
    const envKey = `VITE_APPWRITE_FUNCTION_${toolName.toUpperCase().replace(/-/g, '_')}_ID`;
    const funcId = process.env[envKey];
    
    if (!funcId) {
      console.error(`Skipping ${toolName}, no ID found in .env`);
      continue;
    }

    const toolPath = path.join(toolsDir, toolName);
    const tarPath = path.join(toolsDir, `${toolName}.tar.gz`);

    console.log(`Packaging ${toolName}...`);
    try {
      await tar.c(
        {
          gzip: true,
          file: tarPath,
          cwd: toolPath
        },
        ['.']
      );
    } catch (e) {
      console.error(`Failed to package ${toolName}: ${e.message}`);
      continue;
    }

    console.log(`Deploying ${toolName} to Appwrite (ID: ${funcId})...`);
    try {
      const file = InputFile.fromPath(tarPath, 'code.tar.gz');
      const deployment = await functions.createDeployment({
        functionId: funcId,
        code: file,
        activate: true,
        entrypoint: 'src/main.js',
        commands: 'npm install'
      });
      console.log(`Successfully deployed ${toolName}. Deployment ID: ${deployment.$id}`);
    } catch (e) {
      console.error(`Failed to deploy ${toolName}:`, e.message);
    } finally {
      if (fs.existsSync(tarPath)) {
        fs.unlinkSync(tarPath);
      }
    }
  }
}

main();
