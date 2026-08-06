import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const containerBase = 'https://qofeno-processor.gentleforest-5357c740.centralindia.azurecontainerapps.io';
const secret = 'e4f9b8c2d1a3e5f7a9b0c2d4e6f8a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5';

async function testAzureTools() {
  const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF');

  // Test 1: PDF Compress
  try {
    const form = new FormData();
    form.append('tool', 'pdf-compress');
    form.append('params', JSON.stringify({ compression_level: 'medium' }));
    form.append('file', dummyPdf, { filename: 'sample.pdf' });

    console.log('[POST /pdf/compress] Testing...');
    const r = await fetch(`${containerBase}/pdf/compress`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${secret}`, ...form.getHeaders() },
      body: form
    });
    console.log(`[POST /pdf/compress] Status: ${r.status}`);
    if (r.ok) {
      const buf = await r.arrayBuffer();
      console.log(`  ✓ SUCCESS! Output PDF size: ${buf.byteLength} bytes`);
    } else {
      console.log(`  ✗ Error:`, await r.text());
    }
  } catch (err) {
    console.error('[POST /pdf/compress] Failed:', err.message);
  }

  // Test 2: PDF Repair
  try {
    const form = new FormData();
    form.append('tool', 'pdf-repair');
    form.append('params', JSON.stringify({ engine: 'pikepdf' }));
    form.append('file', dummyPdf, { filename: 'sample.pdf' });

    console.log('\n[POST /pdf/repair] Testing...');
    const r = await fetch(`${containerBase}/pdf/repair`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${secret}`, ...form.getHeaders() },
      body: form
    });
    console.log(`[POST /pdf/repair] Status: ${r.status}`);
    if (r.ok) {
      const buf = await r.arrayBuffer();
      console.log(`  ✓ SUCCESS! Repaired PDF size: ${buf.byteLength} bytes`);
    } else {
      console.log(`  ✗ Error:`, await r.text());
    }
  } catch (err) {
    console.error('[POST /pdf/repair] Failed:', err.message);
  }
}

testAzureTools().catch(console.error);
