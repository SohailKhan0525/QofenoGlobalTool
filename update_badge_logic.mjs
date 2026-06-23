import fs from 'fs';
import path from 'path';

const isNewLogic = "(tool.addedAt ? (Date.now() - new Date(tool.addedAt).getTime() < 7 * 24 * 60 * 60 * 1000) : tool.isNew)";

const catalogPath = path.join(process.cwd(), 'src', 'components', 'Pages', 'ToolsCatalog.tsx');
let catalogContent = fs.readFileSync(catalogPath, 'utf-8');
catalogContent = catalogContent.replace(/tool\.isNew/g, isNewLogic);
fs.writeFileSync(catalogPath, catalogContent);

const appPath = path.join(process.cwd(), 'src', 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf-8');
appContent = appContent.replace(/tool\.isNew/g, isNewLogic);
fs.writeFileSync(appPath, appContent);

console.log('Badge logic updated!');
