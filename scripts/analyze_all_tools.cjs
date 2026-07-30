const fs = require('fs');
const path = require('path');

async function main() {
  const fileContent = fs.readFileSync('src/lib/toolCatalog.ts', 'utf-8');
  
  // Find all objects with slug:
  const lines = fileContent.split('\n');
  const tools = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('slug:')) {
      const match = line.match(/slug:\s*['"]([^'"]+)['"]/);
      if (match) {
        current = { slug: match[1] };
      }
    }
    if (current && line.includes('category:')) {
      const match = line.match(/category:\s*['"]([^'"]+)['"]/);
      if (match) current.category = match[1];
    }
    if (current && line.includes('name:')) {
      const match = line.match(/name:\s*['"]([^'"]+)['"]/);
      if (match) current.name = match[1];
    }
    if (current && line.includes('acceptedExtensions:')) {
      const match = line.match(/acceptedExtensions:\s*(\[[^\]]+\])/);
      if (match) current.exts = match[1];
    }
    if (current && (line.includes('functionId:') || line.includes('isFree:'))) {
      if (current.slug && !tools.some(t => t.slug === current.slug)) {
        tools.push(current);
      }
      current = null;
    }
  }

  console.log(`Parsed ${tools.length} tool objects from toolCatalog.ts`);
  
  // List handlers in functions/
  const funcs = ['qofeno-pdf', 'qofeno-image', 'qofeno-video', 'qofeno-audio', 'qofeno-text', 'qofeno-developer', 'qofeno-data', 'qofeno-security'];
  const handlerMap = {};

  for (const f of funcs) {
    const hDir = path.join('functions', f, 'src', 'handlers');
    if (fs.existsSync(hDir)) {
      const files = fs.readdirSync(hDir);
      for (const file of files) {
        const handlerSlug = file.replace(/\.js$/, '');
        handlerMap[handlerSlug] = { functionName: f, file: path.join(hDir, file) };
      }
    }
  }

  let handledCount = 0;
  let missingHandlerCount = 0;

  const result = [];
  for (const t of tools) {
    const handler = handlerMap[t.slug];
    if (handler) {
      handledCount++;
      result.push({ ...t, status: 'has_handler', handlerPath: handler.file });
    } else {
      missingHandlerCount++;
      result.push({ ...t, status: 'missing_handler', handlerPath: null });
    }
  }

  console.log(`Handled tools: ${handledCount}, Missing handlers: ${missingHandlerCount}`);
  fs.writeFileSync('scripts/tool_inventory.json', JSON.stringify(result, null, 2));
}

main().catch(console.error);
