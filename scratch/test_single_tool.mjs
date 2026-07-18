import { Client, Functions } from 'node-appwrite';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const functions = new Functions(client);

async function main() {
  try {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([595, 842]);
    page.drawText('Qofeno Test PDF Document', { x: 50, y: 780, size: 20, font, color: rgb(0, 0, 0) });
    page.drawText('This is a real valid test document with some content for word count and conversion testing.', { x: 50, y: 745, size: 12, font, color: rgb(0.2, 0.2, 0.2) });
    const bytes = await doc.save({ useObjectStreams: false, useCompression: false });
    const pdfBase64 = Buffer.from(bytes).toString('base64');

    const payload = {
      tool: 'pdf-to-html',
      file_base64: pdfBase64,
      input_filename: 'test.pdf',
      user_id: 'test-runner'
    };
    
    console.log('Sending execution payload...');
    const exec = await functions.createExecution('qofeno-pdf', JSON.stringify(payload), false);
    console.log('Status:', exec.status);
    console.log('Response body:', exec.responseBody);
    console.log('Errors:', exec.errors);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
