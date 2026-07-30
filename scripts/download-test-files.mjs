import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'scratch', 'test_files');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Create minimal valid test files for fast local/remote testing
const samplePdf = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kinds [] /Count 1 /Kids [3 0 R]>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R>> endobj
4 0 obj <</Length 44>> stream
BT /F1 12 Tf 100 700 Td (Hello Qofeno) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000202 00000 n
trailer <</Size 5 /Root 1 0 R>>
startxref
296
%%EOF`;

const sampleCsv = `id,name,role\n1,Zaheer,Developer\n2,Qofeno,SaaS\n`;
const sampleJson = JSON.stringify({ name: "Qofeno", status: "active", version: "1.0" }, null, 2);

fs.writeFileSync(path.join(dir, 'sample.pdf'), samplePdf);
fs.writeFileSync(path.join(dir, 'sample.csv'), sampleCsv);
fs.writeFileSync(path.join(dir, 'sample.json'), sampleJson);

console.log('Sample test files created in scratch/test_files/:', fs.readdirSync(dir));
