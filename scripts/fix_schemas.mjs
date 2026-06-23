import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/lib/toolCatalog.ts');
let content = fs.readFileSync(file, 'utf-8');

// The file exports `FALLBACK_TOOLS` which is an array of objects.
// Let's use a regex to find each object and check if it has schemaMarkup.
// If it doesn't, we will insert it just before the closing brace of the object.

const toolRegex = /({\s*id:\s*['"]([^'"]+)['"][\s\S]*?)(schemaMarkup[\s\S]*?)?(functionId:[\s\S]*?)?(},?\n)/g;

let count = 0;
content = content.replace(toolRegex, (match, p1, id, hasSchema, p4, end) => {
  if (!match.includes('schemaMarkup')) {
    // Extract name and desc
    const nameMatch = match.match(/name:\s*['"](.*?)['"]/);
    const descMatch = match.match(/desc:\s*['"](.*?)['"]/);
    
    const name = nameMatch ? nameMatch[1] : id;
    const desc = descMatch ? descMatch[1] : '';
    
    // Create schema snippet
    const schema = `    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: '${name}',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: '${desc}',
    }),\n`;

    count++;
    
    // Insert schema before functionId or before the closing brace
    if (p4) {
      return p1 + schema + p4 + end;
    } else {
      // Just put it before the closing brace
      return p1 + schema + end;
    }
  }
  return match;
});

fs.writeFileSync(file, content, 'utf-8');
console.log(`Injected schemaMarkup into ${count} tools!`);
