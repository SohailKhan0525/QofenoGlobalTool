import { Client, Databases, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { ID, Permission, Role } from 'node-appwrite';
import pdfParse from 'pdf-parse';

function parseBody(req) {
  const raw = req.body || req.payload || '{}';
  if (typeof raw !== 'string') return raw || {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function decodeFileInput(value) {
  if (typeof value !== 'string' || !value) return null;
  const match = value.match(/^data:([^;]+);base64,(.*)$/i);
  const base64 = match ? match[2] : value;
  const mimeType = match ? match[1] : 'application/pdf';
  return { buffer: Buffer.from(base64, 'base64'), mimeType };
}

async function readInputBuffer(body) {
  const direct = decodeFileInput(body.file_base64 || body.input_base64 || body.data_base64 || body.file);
  if (direct) return direct;
  if (body.file_id && body.bucket_id) {
    const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '');
    const response = await fetch(`${endpoint}/storage/buckets/${body.bucket_id}/files/${body.file_id}/download`, {
      headers: { 'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID, 'X-Appwrite-Key': process.env.APPWRITE_API_KEY },
    });
    if (!response.ok) throw new Error(`Unable to download source file: ${response.status}`);
    return { buffer: Buffer.from(await response.arrayBuffer()), mimeType: 'application/pdf' };
  }
  throw new Error('file_base64 or file_id + bucket_id is required');
}

async function uploadOutput(storage, filename, buffer) {
  const file = await storage.createFile(
    process.env.BUCKET_OUTPUTS, ID.unique(),
    InputFile.fromBuffer(buffer, filename),
    [Permission.read(Role.any()), Permission.delete(Role.any())]
  );
  const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '');
  return { file, download_url: `${endpoint}/storage/buckets/${process.env.BUCKET_OUTPUTS}/files/${file.$id}/download?project=${process.env.APPWRITE_PROJECT_ID}` };
}

async function createExecutionRecord(db, payload) {
  try {
    return await db.createDocument(process.env.DATABASE_ID, 'tool_executions', ID.unique(), {
      user_id: payload.user_id || null, tool_slug: payload.tool_slug, tool_name: payload.tool_name,
      category: payload.category || 'PDF & Documents', status: payload.status,
      input_filename: payload.input_filename || null, input_size: payload.input_size || null,
      output_filename: payload.output_filename || null, output_size: payload.output_size || null,
      download_url: payload.download_url || null, error_message: payload.error_message || null,
      duration_ms: payload.duration_ms || null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
  } catch (_) {}
}

async function processWithRetry(processFn, maxRetries = 2) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try { return await processFn(); }
    catch (err) { lastError = err; await new Promise(r => setTimeout(r, 500)); }
  }
  throw lastError;
}

function validatePdfOutput(buffer) {
  if (!buffer || buffer.length === 0) throw new Error('Output file is empty — processing failed');
  const header = buffer.toString('utf8', 0, 5);
  if (header !== '%PDF-') throw new Error('Output is not a valid PDF file');
}


export default async ({ req, res, log, error }) => {
  const body = parseBody(req);
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  const storage = new Storage(client);
  const db = new Databases(client);
  const startedAt = Date.now();

  try {

  const source = await readInputBuffer(body);
  const inputName = String(body.input_filename || body.filename || 'input.pdf');

  const { outputBuffer, outputName } = await processWithRetry(async () => {
    const pdfData = await pdfParse(source.buffer);
    const text = pdfData.text || '';

    if (!text.trim()) throw new Error('No text content found in PDF. Scanned PDFs require OCR first.');

    const paragraphs = text.split(/\n{2,}/).filter(p => p.trim());
    const htmlParas = paragraphs.map(p => `    <p>${p.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').trim()}</p>`).join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${inputName.replace(/\.pdf$/i, '')}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.7; color: #333; }
    h1 { color: #1a1a2e; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
    p { margin: 1em 0; text-align: justify; }
    .meta { color: #888; font-size: 0.85em; margin-bottom: 2em; }
  </style>
</head>
<body>
  <h1>${inputName.replace(/\.pdf$/i, '')}</h1>
  <div class="meta">Converted from PDF · ${pdfData.numpages} pages · Qofeno</div>
${htmlParas}
</body>
</html>`;

    const outBuf = Buffer.from(html, 'utf8');
    const outName = inputName.replace(/\.pdf$/i, '') + '.html';
    if (!outBuf || outBuf.length === 0) throw new Error('Output HTML is empty');
    log(`Converted PDF to HTML: ${outName} (${outBuf.length} bytes)`);
    return { outputBuffer: outBuf, outputName: outName };
  });


    const uploaded = await uploadOutput(storage, outputName, outputBuffer);
    await createExecutionRecord(db, {
      user_id: body.user_id || null, tool_slug: 'pdf-to-html', tool_name: 'PDF to HTML',
      status: 'completed', input_filename: body.input_filename || body.filename || null,
      input_size: source?.buffer?.length || outputBuffer.length,
      output_filename: outputName, output_size: outputBuffer.length,
      download_url: uploaded.download_url, duration_ms: Date.now() - startedAt,
    });

    return res.json({
      success: true, output_filename: outputName, output_size: outputBuffer.length,
      download_url: uploaded.download_url, file_id: uploaded.file.$id, duration_ms: Date.now() - startedAt,
    });
  } catch (err) {
    error(err.message);
    await createExecutionRecord(db, {
      user_id: body.user_id || null, tool_slug: 'pdf-to-html', tool_name: 'PDF to HTML',
      status: 'error', input_filename: body.input_filename || body.filename || null,
      error_message: err.message, duration_ms: Date.now() - startedAt,
    });
    return res.json({ success: false, error: err.message }, 500);
  }
};
