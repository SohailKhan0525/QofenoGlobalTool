import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'components', 'Pages', 'FileToolWorkspace.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// We want to replace lines like:
// functionId: 'pdf-rotate',
// with:
// functionId: FUNCTION_IDS.pdfRotate || 'pdf-rotate',

const regex = /functionId:\s*'([a-z0-9-]+)'/g;

content = content.replace(regex, (match, slug) => {
  // Exception for image/video tools that are already correctly mapped or we want to map them similarly
  // e.g. 'pdf-rotate' -> 'pdfRotate'
  const camelCase = slug.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  return `functionId: FUNCTION_IDS.${camelCase} || '${slug}'`;
});

fs.writeFileSync(filePath, content);
console.log('FileToolWorkspace updated successfully.');
