import pdfParse from 'pdf-parse';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function main() {
  try {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([595, 842]);
    page.drawText('Qofeno Test PDF Document', { x: 50, y: 780, size: 20, font, color: rgb(0, 0, 0) });
    page.drawText('This is a real valid test document with some content for word count and conversion testing.', { x: 50, y: 745, size: 12, font, color: rgb(0.2, 0.2, 0.2) });
    const bytes = await doc.save({ useObjectStreams: false, useCompression: false });
    
    console.log('Running pdfParse locally...');
    const pdfData = await pdfParse(Buffer.from(bytes));
    console.log('Success, extracted chars:', pdfData.text.length);
  } catch (err) {
    console.error('Error:', err);
  }
}
main();
