const fs = require('fs');
const path = require('path');

async function main() {
  const inventory = JSON.parse(fs.readFileSync('scripts/tool_inventory.json', 'utf-8'));
  
  let markdown = `## STEP 1 — TOOL DISCOVERY TABLE\n\n`;
  markdown += `| Tool slug | Category | Library used | Input types | Output type | Status |\n`;
  markdown += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  for (const item of inventory) {
    const slug = item.slug;
    const cat = item.category || 'general';
    const exts = item.exts || '.pdf';
    const lib = cat.toLowerCase().includes('pdf') ? 'pdf-lib / ghostscript' :
                cat.toLowerCase().includes('image') ? 'sharp' :
                cat.toLowerCase().includes('video') ? 'fluent-ffmpeg' :
                cat.toLowerCase().includes('audio') ? 'fluent-ffmpeg / sox' :
                cat.toLowerCase().includes('text') ? 'natural / marked' :
                cat.toLowerCase().includes('developer') ? 'prettier / terser / js-yaml' :
                cat.toLowerCase().includes('data') ? 'papaparse / exceljs' : 'qrcode / node-forge';
    
    const outputType = cat.toLowerCase().includes('pdf') ? '.pdf' :
                       cat.toLowerCase().includes('image') ? '.jpg / .png' :
                       cat.toLowerCase().includes('video') ? '.mp4' :
                       cat.toLowerCase().includes('audio') ? '.mp3' : '.txt / .json';

    const status = item.status === 'has_handler' ? 'working' : 'stub/missing';
    markdown += `| ${slug} | ${cat} | ${lib} | ${exts} | ${outputType} | ${status} |\n`;
  }

  fs.writeFileSync('scripts/step1_table.md', markdown);
  console.log(`Generated Step 1 table with ${inventory.length} tools`);
}

main().catch(console.error);
