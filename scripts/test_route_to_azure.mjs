import { routeToAzure } from '../functions/shared/azure-router.js';
import { Client, Storage, ID, Permission, Role } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const storage = new Storage(client);

async function testFullRouteToAzure() {
  console.log('=== End-to-End Testing routeToAzure with Appwrite Storage ===\n');

  // Create valid PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  page.drawText('Qofeno Pro Tool Azure Processing Test Document', { x: 50, y: 350, size: 18, font, color: rgb(0, 0.4, 0.8) });
  page.drawText('Sample text content for OCR and Word conversion.', { x: 50, y: 300, size: 12, font });
  const pdfBytes = await pdfDoc.save();

  const uploaded = await storage.createFile('tool_inputs', ID.unique(), InputFile.fromBuffer(Buffer.from(pdfBytes), 'pro-test.pdf'), [Permission.read(Role.any())]);
  const fileId = uploaded.$id;
  console.log('✓ Uploaded test file to Appwrite storage, ID:', fileId);

  // Test 1: PDF Compress
  console.log('\nRouting pdf-compressor to Azure Container...');
  const res1 = await routeToAzure({
    file_id: fileId,
    tool: 'pdf-compressor',
    params: { input_filename: 'pro-test.pdf', compression_level: 'medium' },
    storage,
    log: console.log
  });
  console.log('pdf-compressor Result:', JSON.stringify(res1, null, 2));

  // Test 2: PDF to Word
  console.log('\nRouting pdf-to-word to Azure Container...');
  const res2 = await routeToAzure({
    file_id: fileId,
    tool: 'pdf-to-word',
    params: { input_filename: 'pro-test.pdf' },
    storage,
    log: console.log
  });
  console.log('pdf-to-word Result:', JSON.stringify(res2, null, 2));
}

testFullRouteToAzure().catch(console.error);
