const fs = require('fs');
const path = require('path');

const toolsDir = 'c:/Qofeno/QofenoGlobalTool/appwrite-functions/tools';

function updateParseBody(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      const mainJs = path.join(fullPath, 'src', 'main.js');
      if (fs.existsSync(mainJs)) {
        let content = fs.readFileSync(mainJs, 'utf8');
        
        // Replacing parseBody to safely handle bodyRaw and req.body object
        const newParseBody = `function parseBody(req) {
  if (req.bodyRaw && typeof req.bodyRaw === 'string') {
    try { return JSON.parse(req.bodyRaw); } catch { /* ignore */ }
  }
  if (req.body && typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { /* ignore */ }
  }
  if (typeof req.body === 'object' && req.body !== null) {
    return req.body;
  }
  return {};
}`;

        content = content.replace(/function parseBody\(req\) \{[\s\S]*?return \{\};\s*\}/, newParseBody);
        
        fs.writeFileSync(mainJs, content, 'utf8');
      }
    }
  }
}

updateParseBody(toolsDir);
console.log('Fixed parseBody across all tools');
