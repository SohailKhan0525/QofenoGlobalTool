/**
 * pdf-watermark — Add text watermark to all pages of a PDF.
 * Uses pdf-lib for real PDF manipulation.
 */
import { Client, Databases, ID, Permission, Role, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

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
    const watermarkText = String(body.watermark_text || body.text || 'CONFIDENTIAL');
    const opacity = Math.max(0.05, Math.min(1, parseFloat(body.opacity || '0.3')));
    const fontSize = Math.max(12, Math.min(120, parseInt(body.font_size || '48', 10)));
    const rotation = parseFloat(body.rotation || '45');
    const position = String(body.position || 'Center');
    const applyTo = String(body.apply_to || 'All pages');

    const { outputBuffer, outputName } = await processWithRetry(async () => {
      const pdfDoc = await PDFDocument.load(source.buffer, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();

      const pageIndices = applyTo === 'First page' ? [0] :
                          applyTo === 'Last page' ? [pages.length - 1] :
                          pages.map((_, i) => i);

      for (const idx of pageIndices) {
        const page = pages[idx];
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        let x = width / 2 - textWidth / 2;
        let y = height / 2 - textHeight / 2;

        if (position === 'Top-left') { x = 20; y = height - textHeight - 20; }
        else if (position === 'Top-right') { x = width - textWidth - 20; y = height - textHeight - 20; }
        else if (position === 'Bottom-left') { x = 20; y = 20; }
        else if (position === 'Bottom-right') { x = width - textWidth - 20; y = 20; }

        page.drawText(watermarkText, {
          x, y,
          size: fontSize,
          font,
          color: rgb(0.7, 0.7, 0.7),
          opacity,
          rotate: degrees(rotation),
        });
      }

      const outBuf = Buffer.from(await pdfDoc.save({ useObjectStreams: true }));
      const outName = inputName.replace(/\.pdf$/i, '') + '-watermarked.pdf';

      if (!outBuf || outBuf.length === 0) throw new Error('Output file is empty — processing failed');
      if (outBuf.toString('utf8', 0, 5) !== '%PDF-') throw new Error('Output is not a valid PDF file');

      log(`Watermarked PDF: ${outName} (${outBuf.length} bytes), ${pages.length} pages`);
      return { outputBuffer: outBuf, outputName: outName };
    });

    const uploaded = await uploadOutput(storage, outputName, outputBuffer);
    await createExecutionRecord(db, {
      user_id: body.user_id || null, tool_slug: 'pdf-watermark', tool_name: 'PDF Watermark',
      status: 'completed', input_filename: inputName, input_size: source.buffer.length,
      output_filename: outputName, output_size: outputBuffer.length, download_url: uploaded.download_url,
      duration_ms: Date.now() - startedAt,
    });

    return res.json({
      success: true, output_filename: outputName, output_size: outputBuffer.length,
      download_url: uploaded.download_url, file_id: uploaded.file.$id, duration_ms: Date.now() - startedAt,
    });
  } catch (err) {
    error(err.message);
    await createExecutionRecord(db, {
      user_id: body.user_id || null, tool_slug: 'pdf-watermark', tool_name: 'PDF Watermark',
      status: 'error', input_filename: body.input_filename || null, error_message: err.message, duration_ms: Date.now() - startedAt,
    });
    return res.json({ success: false, error: err.message }, 500);
  }
};