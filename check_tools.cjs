const fs = require('fs');
const path = require('path');

const toolsDir = 'c:/Qofeno/QofenoGlobalTool/appwrite-functions/tools';

function checkTools() {
  const files = fs.readdirSync(toolsDir);
  const realTools = [];
  const placeholderTools = [];

  for (const file of files) {
    const fullPath = path.join(toolsDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      const mainJs = path.join(fullPath, 'src', 'main.js');
      if (fs.existsSync(mainJs)) {
        const content = fs.readFileSync(mainJs, 'utf8');
        // A placeholder usually just copies the input to the output without processing
        if (content.includes('// Placeholder') || content.includes('// Simplistic booklet') || content.includes('just copy pages for now') || content.includes('PDFDocument.create()') && !content.includes('processWithRetry') || content.includes('PDFDocument.load') === false && file.startsWith('pdf-') && !content.includes('gs') && !content.includes('soffice') && !content.includes('pdf-portfolio')) {
          placeholderTools.push(file);
        } else {
          realTools.push(file);
        }
      }
    }
  }

  console.log('Real Tools:', realTools.length);
  console.log('Placeholder Tools:', placeholderTools.length);
  console.log('Placeholder list:', placeholderTools.join(', '));
}

checkTools();
