import path from 'node:path';
import { Client, Storage, ID, Functions } from 'appwrite';
// create a minimal PDF without external deps
import os from 'node:os';
import fs from 'node:fs';

const envPath = path.join(process.cwd(), '.env.server');
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).filter((line) => line && !line.trim().startsWith('#') && line.includes('=')).map((line) => {
    const index = line.indexOf('=');
    return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
  })
);

const client = new Client()
  .setEndpoint(env.APPWRITE_ENDPOINT)
  .setProject(env.APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const storage = new Storage(client);
const functions = new Functions(client);

async function main() {
  // minimal PDF bytes
  const pdfString = `%PDF-1.1
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
72 712 Td
(Qofeno E2E Test) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000110 00000 n 
0000000190 00000 n 
0000000240 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
320
%%EOF`;
  const bytes = Buffer.from(pdfString, 'utf8');

  // call pdf-compressor function directly with base64 payload
  const funcId = env.PDF_COMPRESSOR_FUNCTION_ID || env.VITE_APPWRITE_FUNCTION_PDF_COMPRESSOR_ID || '8e0d74d220b841bab88e1eab430a48a4';
  console.log('Calling pdf-compressor function', funcId);
  const base64 = Buffer.from(bytes).toString('base64');
  const payload = JSON.stringify({ file_base64: `data:application/pdf;base64,${base64}`, input_filename: 'qofeno-e2e-test.pdf' });
  const exec = await functions.createExecution(funcId, payload, false);
  console.log('Function response:', exec.responseBody);

  // if response lacks download_url but has file_id, call create-download-link
  try {
    const resp = typeof exec.responseBody === 'string' ? JSON.parse(exec.responseBody) : exec.responseBody;
    if (resp && !resp.download_url && resp.file_id) {
      const createLinkId = env.CREATE_DOWNLOAD_LINK_ID || 'c461e7073a8f4ad2b177132d9864dcec';
      console.log('Requesting signed link via', createLinkId);
      const linkExec = await functions.createExecution(createLinkId, JSON.stringify({ file_id: resp.file_id, bucket_id: env.BUCKET_OUTPUTS || env.BUCKET_OUTPUTS_ID }), false);
      console.log('Create-download-link response:', linkExec.responseBody);
    }
  } catch (e) {
    console.warn('Could not parse function response:', e.message);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
