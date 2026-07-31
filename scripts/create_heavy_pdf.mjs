import { PDFDocument } from 'pdf-lib';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

mkdirSync('test-data/pdf', { recursive: true });

async function makeHeavyPdf() {
  console.log('Generating 2.5MB multi-page heavy PDF for ultra-fast reliable integration tests...');
  const baseBuf = readFileSync('test-data/pdf/sample_pdf_2.pdf');
  const baseDoc = await PDFDocument.load(baseBuf);
  
  const heavyDoc = await PDFDocument.create();
  
  // Copy pages 25 times to create a real 2.5MB multi-page PDF document
  for (let i = 0; i < 25; i++) {
    const copiedPages = await heavyDoc.copyPages(baseDoc, baseDoc.getPageIndices());
    copiedPages.forEach(p => heavyDoc.addPage(p));
  }

  const heavyBytes = await heavyDoc.save();
  writeFileSync('test-data/pdf/heavy_2.5mb_pdf.pdf', heavyBytes);
  console.log(`Successfully created test-data/pdf/heavy_2.5mb_pdf.pdf (${(heavyBytes.length / 1024 / 1024).toFixed(2)} MB)`);
}

makeHeavyPdf().catch(console.error);
