/**
 * pdf-resize — Resize PDF pages to a standard paper size.
 * Uses pdf-lib to set page dimensions.
 */
import { Client, Databases, Query, ID, Permission, Role, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { PDFDocument, PageSizes } from 'pdf-lib';

function parseBody(req) {
  if (req.bodyRaw && typeof req.bodyRaw === 'string') {
    try { return JSON.parse(req.bodyRaw); } catch { /* ignore */ }
  }
  if (req.body && typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { /* ignore */ }
  }
  if (typeof req.body === 'object' && req.body !== null) {
    return req.body;
  }
  return {};
}

function decodeFileInput(value) {
  if (typeof value !== 'string' || !value) return null;
  const match = value.match(/^data:([^;]+);base64,(.*)$/i);
  const base64 = match ? match[2] : value;
  return { buffer: Buffer.from(base64, 'base64'), mimeType: 'application/pdf' };
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

    // RATE LIMITING
    const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown_ip';
    const hourKey = `${clientIp}_${Math.floor(Date.now() / 3600000)}`;
    
    let isProUser = false;
    if (body.user_id) {
      try {
        const userMeta = await db.getDocument(process.env.DATABASE_ID, 'users_meta', body.user_id);
        if (userMeta && (userMeta.plan === 'pro' || userMeta.plan === 'enterprise')) {
          isProUser = true;
        }
      } catch (err) { /* ignore */ }
    }
    
    const limit = isProUser ? 100 : 20;
    
    try {
      const existing = await db.listDocuments(process.env.DATABASE_ID, 'rate_limits', [
        Query.equal('key', hourKey)
      ]);
      
      if (existing.total > 0) {
        if (existing.documents[0].count >= limit) {
          return res.json({
            success: false,
            error: "Rate limit exceeded. Please wait or upgrade to PRO."
          }, 429);
        } else {
          await db.updateDocument(process.env.DATABASE_ID, 'rate_limits', existing.documents[0].$id, {
            count: existing.documents[0].count + 1,
            updated_at: new Date().toISOString()
          });
        }
      } else {
        await db.createDocument(process.env.DATABASE_ID, 'rate_limits', ID.unique(), {
          key: hourKey,
          ip: clientIp,
          count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      log('Rate limit check failed, skipping: ' + err.message);
    }
    // END RATE LIMITING

    return await db.createDocument(process.env.DATABASE_ID, 'tool_executions', ID.unique(), {
      user_id: payload.user_id || null, tool_slug: payload.tool_slug, tool_name: payload.tool_name,
      category: 'PDF & Documents', status: payload.status,
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

// Page sizes in points [width, height] — portrait
const PAGE_SIZE_MAP = {
  'A4': [595.28, 841.89],
  'A3': [841.89, 1190.55],
  'A5': [419.53, 595.28],
  'Letter': [612, 792],
  'Legal': [612, 1008],
  'Tabloid': [792, 1224],
  'B5': [498.90, 708.66],
};

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
    const targetSize = String(body.page_size || body.size || 'A4');
    const orientation = String(body.orientation || 'portrait').toLowerCase();
    const scaleContent = body.scale_content !== false; // default true

    let [targetW, targetH] = PAGE_SIZE_MAP[targetSize] || PAGE_SIZE_MAP['A4'];
    if (orientation === 'landscape') [targetW, targetH] = [targetH, targetW];

    const { outputBuffer, outputName } = await processWithRetry(async () => {
      const srcDoc = await PDFDocument.load(source.buffer, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();
      const pageCount = srcDoc.getPageCount();

      for (let i = 0; i < pageCount; i++) {
        const [srcPage] = await newDoc.copyPages(srcDoc, [i]);
        const newPage = newDoc.addPage([targetW, targetH]);
        const { width: srcW, height: srcH } = srcPage.getSize();

        if (scaleContent) {
          const scaleX = targetW / srcW;
          const scaleY = targetH / srcH;
          const scale = Math.min(scaleX, scaleY);
          const offsetX = (targetW - srcW * scale) / 2;
          const offsetY = (targetH - srcH * scale) / 2;

          newPage.drawPage(srcPage, {
            x: offsetX, y: offsetY,
            width: srcW * scale, height: srcH * scale,
          });
        } else {
          newPage.drawPage(srcPage, { x: 0, y: 0, width: srcW, height: srcH });
        }
      }

      const outBuf = Buffer.from(await newDoc.save({ useObjectStreams: true }));
      const outName = inputName.replace(/\.pdf$/i, '') + `-${targetSize.toLowerCase()}.pdf`;

      if (!outBuf || outBuf.length === 0) throw new Error('Output file is empty');
      if (outBuf.toString('utf8', 0, 5) !== '%PDF-') throw new Error('Output is not a valid PDF');

      log(`Resized ${pageCount} pages to ${targetSize} (${targetW}x${targetH} pts, ${orientation})`);
      return { outputBuffer: outBuf, outputName: outName };
    });

    const uploaded = await uploadOutput(storage, outputName, outputBuffer);
    await createExecutionRecord(db, {
      user_id: body.user_id || null, tool_slug: 'pdf-resize', tool_name: 'PDF Resize Tool',
      status: 'completed', input_filename: inputName, input_size: source.buffer.length,
      output_filename: outputName, output_size: outputBuffer.length,
      download_url: uploaded.download_url, duration_ms: Date.now() - startedAt,
    });

    return res.json({
      success: true, output_filename: outputName, output_size: outputBuffer.length,
      target_size: targetSize, orientation,
      download_url: uploaded.download_url, file_id: uploaded.file.$id, duration_ms: Date.now() - startedAt,
    });
  } catch (err) {
    error(err.message);
    await createExecutionRecord(db, {
      user_id: body.user_id || null, tool_slug: 'pdf-resize', tool_name: 'PDF Resize Tool',
      status: 'error', input_filename: body.input_filename || null,
      error_message: err.message, duration_ms: Date.now() - startedAt,
    });
    return res.json({ success: false, error: err.message }, 500);
  }
};
