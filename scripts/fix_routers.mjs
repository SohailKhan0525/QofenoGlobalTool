import fs from 'fs';
import path from 'path';

const categories = [
  'qofeno-pdf',
  'qofeno-image',
  'qofeno-video',
  'qofeno-audio',
  'qofeno-text',
  'qofeno-developer',
  'qofeno-data',
  'qofeno-security'
];

function main() {
  for (const cat of categories) {
    const mainFile = path.resolve('functions', cat, 'src', 'main.js');
    if (!fs.existsSync(mainFile)) {
      console.log(`Skipping missing main.js for ${cat}`);
      continue;
    }

    let content = fs.readFileSync(mainFile, 'utf8');
    
    // Replace the execution block
    const oldBlock = `  // Execute handler
  try {
    const result = await handler({ body, storage, db, client, context });
    return success(res, result);
  } catch (err) {
    logError(\`Execution error in \${tool}: \${err.stack || err.message}\`);
    return error(res, err.message, "PROCESSING_ERROR", 500);
  }`;

    const newBlock = `  // Execute handler
  try {
    const result = await handler(context);
    return result;
  } catch (err) {
    logError(\`Execution error in \${tool}: \${err.stack || err.message}\`);
    return error(res, err.message, "PROCESSING_ERROR", 500);
  }`;

    if (content.includes(oldBlock)) {
      content = content.replace(oldBlock, newBlock);
      fs.writeFileSync(mainFile, content, 'utf8');
      console.log(`✓ Fixed router main.js for ${cat}`);
    } else {
      console.log(`- Router main.js for ${cat} already fixed or mismatch`);
    }
  }
}

main();
