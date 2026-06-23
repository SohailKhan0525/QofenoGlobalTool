import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'lib', 'toolCatalog.ts');
let content = fs.readFileSync(filePath, 'utf-8');

const dateStr = new Date().toISOString();

// Find tools that we added recently. They are mostly from line 400 onwards and have isNew: true.
// Actually, we can just replace `isNew: true, isPopular` with `isNew: false, addedAt: '${dateStr}', isPopular`
content = content.replace(/isNew:\s*true,\s*isPopular/g, `isNew: false, addedAt: '${dateStr}', isPopular`);

fs.writeFileSync(filePath, content);
console.log('toolCatalog.ts updated with addedAt');
