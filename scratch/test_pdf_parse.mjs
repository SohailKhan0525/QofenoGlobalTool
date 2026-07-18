import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import pdfParse from 'pdf-parse';

async function main() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  page.drawText('Qofeno Test PDF Document', { x: 50, y: 780, size: 20, font, color: rgb(0, 0, 0) });
  page.drawText('This is a real valid test document with some content for word count and conversion testing.', { x: 50, y: 745, size: 12, font, color: rgb(0.2, 0.2, 0.2) });
  
  const bytes = await doc.save({ useObjectStreams: false, useCompression: false });
  console.log(`Saved PDF size: ${bytes.length} bytes`);
  
  try {
    const data = await pdfParse(Buffer.from(bytes));
    console.log('PDF-parse success! Extracted text:', JSON.stringify(data.text));
  } catch (err) {
    console.error('PDF-parse failed:', err);
  }
}

main();
