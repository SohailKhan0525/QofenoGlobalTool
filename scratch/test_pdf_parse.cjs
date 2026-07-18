const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const pdfParse = require('pdf-parse');

async function testWithSettings(options) {
  console.log('\nTesting with options:', options);
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  page.drawText('Qofeno Test PDF Document', { x: 50, y: 780, size: 20, font, color: rgb(0, 0, 0) });
  page.drawText('This is a real valid test document with some content for word count and conversion testing.', { x: 50, y: 745, size: 12, font, color: rgb(0.2, 0.2, 0.2) });
  
  const bytes = await doc.save(options);
  console.log(`Saved PDF size: ${bytes.length} bytes`);
  
  try {
    const data = await pdfParse(Buffer.from(bytes));
    console.log('✅ Success! Pages:', data.numpages, 'Text length:', data.text.trim().length);
    console.log('Text content:', JSON.stringify(data.text.trim()));
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

async function main() {
  // Test 1: default save
  await testWithSettings({});

  // Test 2: useObjectStreams: false
  await testWithSettings({ useObjectStreams: false });

  // Test 3: useObjectStreams: false and useCompression: false (if it exists)
  await testWithSettings({ useObjectStreams: false, useCompression: false });
}

main();
