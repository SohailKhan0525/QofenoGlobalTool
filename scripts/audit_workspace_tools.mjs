import fs from 'fs';
import path from 'path';

const toolsDir = 'appwrite-functions/tools';
const workspacePath = 'src/components/Pages/FileToolWorkspace.tsx';

if (!fs.existsSync(toolsDir)) {
  console.error('tools dir not found');
  process.exit(1);
}

const functionFolders = fs.readdirSync(toolsDir).filter(f => fs.statSync(path.join(toolsDir, f)).isDirectory());

const workspaceContent = fs.readFileSync(workspacePath, 'utf8');

console.log('Total function folders:', functionFolders.length);

const missingInSlugs = [];
const missingInConfig = [];

for (const folder of functionFolders) {
  // Check FILE_TOOL_SLUGS
  if (!workspaceContent.includes(`'${folder}'`) && !workspaceContent.includes(`"${folder}"`)) {
    missingInSlugs.push(folder);
  }
}

console.log('Missing in FILE_TOOL_SLUGS or FILE_TOOL_CONFIG:', missingInSlugs.join(', '));
