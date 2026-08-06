import fetch from 'node-fetch';
import FormData from 'form-data';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import dotenv from 'dotenv';
dotenv.config();

const containerBase = 'https://qofeno-processor.gentleforest-5357c740.centralindia.azurecontainerapps.io';
const secret = 'e4f9b8c2d1a3e5f7a9b0c2d4e6f8a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5';

async function testWithValidPdfDoc() {
  console.log('Generating valid PDF document with pdf-lib...');
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  page.drawText('Qofeno Pro Tool Azure Processing Test Document', { x: 50, y: 350, size: 18, font, color: rgb(0, 0.4, 0.8) });
  page.drawText('Sample text content for OCR and Word conversion.', { x: 50, y: 300, size: 12, font });

  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);
  console.log(`Valid PDF generated: ${pdfBuffer.length} bytes\n`);

  // Test 1: PDF Compress
  try {
    const form1 = new FormData();
    form1.append('compression_level', 'medium');
    form1.append('file', pdfBuffer, { filename: 'sample.pdf', contentType: 'application/pdf' });

    console.log('[POST /pdf/compress] Testing...');
    const r1 = await fetch(`${containerBase}/pdf/compress`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${secret}`, ...form1.getHeaders() },
      body: form1
    });
    console.log(`[POST /pdf/compress] Status: ${r1.status}`);
    if (r1.ok) {
      const buf = await r1.arrayBuffer();
      console.log(`  ✓ SUCCESS! Compressed PDF size: ${buf.byteLength} bytes`);
      console.log(`  Headers: X-Reduction-Percent=${r1.headers.get('x-reduction-percent')}`);
    } else {
      console.log(`  ✗ Failed:`, await r1.text());
    }
  } catch (err) {
    console.error('Compress test error:', err.message);
  }

  // Test 2: PDF to Word
  try {
    const form2 = new FormData();
    form2.append('file', pdfBuffer, { filename: 'sample.pdf', contentType: 'application/pdf' });

    console.log('\n[POST /pdf/to-word] Testing...');
    const r2 = await fetch(`${containerBase}/pdf/to-word`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${secret}`, ...form2.getHeaders() },
      body: form2
    });
    console.log(`[POST /pdf/to-word] Status: ${r2.status}`);
    if (r2.ok) {
      const buf = await r2.arrayBuffer();
      console.log(`  ✓ SUCCESS! Converted Word DOCX size: ${buf.byteLength} bytes`);
      console.log(`  Headers: X-Output-Filename=${r2.headers.get('x-output-filename')}`);
    } else {
      console.log(`  ✗ Failed:`, await r2.text());
    }
  } catch (err) {
    console.error('Word test error:', err.message);
  }
}

testWithValidPdfDoc().catch(console.error);
