const fs = require('fs');

async function main() {
  const fileContent = fs.readFileSync('src/lib/toolCatalog.ts', 'utf-8');
  // Match tool definitions
  const slugs = [];
  const regex = /slug:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(fileContent)) !== null) {
    if (!slugs.includes(match[1])) {
      slugs.push(match[1]);
    }
  }

  console.log('Total Slugs Found in toolCatalog.ts:', slugs.length);
  console.log('Sample Slugs:', slugs.slice(0, 30));
}

main().catch(console.error);
