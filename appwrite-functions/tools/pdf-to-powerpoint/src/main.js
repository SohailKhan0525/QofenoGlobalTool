import { Client, Databases, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { ID, Permission, Role } from 'node-appwrite';
import pdfParse from 'pdf-parse';
import PptxGenJS from 'pptxgenjs';

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
    if (!text.trim()) throw new Error('No text content found in PDF.');

    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.title = inputName.replace(/\.pdf$/i, '');
    pptx.author = 'Qofeno';

    // Title slide
    const titleSlide = pptx.addSlide();
    titleSlide.addText(inputName.replace(/\.pdf$/i, ''), { x: 0.5, y: 1.5, w: '90%', h: 1.5, fontSize: 36, bold: true, color: '1a1a2e', align: 'center' });
    titleSlide.addText('Converted from PDF by Qofeno', { x: 0.5, y: 3.5, w: '90%', h: 0.5, fontSize: 14, color: '888888', align: 'center' });

    // Content slides — one paragraph per slide
    const paragraphs = text.split(/\n{2,}/).filter(p => p.trim()).slice(0, 20); // max 20 slides
    for (let i = 0; i < paragraphs.length; i++) {
      const slide = pptx.addSlide();
      slide.addText(`Page ${i + 1}`, { x: 0.5, y: 0.3, w: '90%', h: 0.4, fontSize: 14, color: '7c3aed', bold: true });
      slide.addText(paragraphs[i].trim(), { x: 0.5, y: 1, w: '90%', h: 5, fontSize: 16, color: '333333', valign: 'top', wrap: true });
    }

    const outBuf = Buffer.from(await pptx.write({ outputType: 'nodebuffer' }));
    const outName = inputName.replace(/\.pdf$/i, '') + '.pptx';
    if (!outBuf || outBuf.length === 0) throw new Error('Output PPTX is empty');
    if (outBuf[0] !== 0x50 || outBuf[1] !== 0x4B) throw new Error('Output .pptx is corrupted');
    log(`Converted PDF to PPTX: ${outName} (${outBuf.length} bytes), ${paragraphs.length + 1} slides`);
    return { outputBuffer: outBuf, outputName: outName };
  });


    const uploaded = await uploadOutput(storage, outputName, outputBuffer);
    await createExecutionRecord(db, {
      user_id: body.user_id || null, tool_slug: 'pdf-to-powerpoint', tool_name: 'PDF to PowerPoint',
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
      user_id: body.user_id || null, tool_slug: 'pdf-to-powerpoint', tool_name: 'PDF to PowerPoint',
      status: 'error', input_filename: body.input_filename || body.filename || null,
      error_message: err.message, duration_ms: Date.now() - startedAt,
    });
    return res.json({ success: false, error: err.message }, 500);
  }
};
