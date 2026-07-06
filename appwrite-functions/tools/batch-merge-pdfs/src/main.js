/**
 * batch-merge-pdfs — Merge multiple PDFs in a batch operation.
 * Accepts an array of file_base64 or file_ids and merges them all into one PDF.
 * Same as pdf-merger but optimized for larger batches with proper validation.
 */
import { Client, Databases, Query, ID, Permission, Role, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { PDFDocument } from 'pdf-lib';

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

async function readBuffer(item) {
  if (item.file_base64 || item.input_base64) {
    const raw = item.file_base64 || item.input_base64;
    const match = raw.match(/^data:([^;]+);base64,(.*)$/i);
    const base64 = match ? match[2] : raw;
    return Buffer.from(base64, 'base64');
  }
  if (item.file_id && item.bucket_id) {
    const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '');
    const response = await fetch(`${endpoint}/storage/buckets/${item.bucket_id}/files/${item.file_id}/download`, {
      headers: { 'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID, 'X-Appwrite-Key': process.env.APPWRITE_API_KEY },
    });
    if (!response.ok) throw new Error(`Unable to download file ${item.file_id}: ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }
  throw new Error('Each file requires file_base64 or file_id+bucket_id');
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
    const fileItems = Array.isArray(body.files) ? body.files : [];
    if (fileItems.length < 2) throw new Error('At least 2 PDFs required for batch merge');
    if (fileItems.length > 50) throw new Error('Maximum 50 PDFs per batch merge');

    log(`Batch merging ${fileItems.length} PDFs`);

    const merged = await PDFDocument.create();
    let totalInputSize = 0;
    let totalPageCount = 0;

    for (let i = 0; i < fileItems.length; i++) {
      const item = fileItems[i];
      const buf = await readBuffer(item);
      totalInputSize += buf.length;

      let srcDoc;
      try {
        srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
      } catch (loadErr) {
        throw new Error(`File ${i + 1} is not a valid PDF: ${loadErr.message}`);
      }

      const pages = await merged.copyPages(srcDoc, srcDoc.getPageIndices());
      pages.forEach(page => merged.addPage(page));
      totalPageCount += srcDoc.getPageCount();
      log(`Added file ${i + 1}/${fileItems.length}: ${srcDoc.getPageCount()} pages`);
    }

    const outBuf = Buffer.from(await merged.save({ useObjectStreams: true }));
    const outputName = String(body.output_filename || 'batch-merged.pdf');

    if (!outBuf || outBuf.length === 0) throw new Error('Merged output is empty');
    if (outBuf.toString('utf8', 0, 5) !== '%PDF-') throw new Error('Merged output is not a valid PDF');

    log(`Batch merge complete: ${totalPageCount} pages, ${outBuf.length} bytes`);

    const uploaded = await uploadOutput(storage, outputName, outBuf);
    await createExecutionRecord(db, {
      user_id: body.user_id || null, tool_slug: 'batch-merge-pdfs', tool_name: 'Batch Merge PDFs',
      status: 'completed', input_filename: `${fileItems.length} files`,
      input_size: totalInputSize, output_filename: outputName, output_size: outBuf.length,
      download_url: uploaded.download_url, duration_ms: Date.now() - startedAt,
    });

    return res.json({
      success: true, output_filename: outputName, output_size: outBuf.length,
      total_pages: totalPageCount, files_merged: fileItems.length,
      download_url: uploaded.download_url, file_id: uploaded.file.$id, duration_ms: Date.now() - startedAt,
    });
  } catch (err) {
    error(err.message);
    await createExecutionRecord(db, {
      user_id: body.user_id || null, tool_slug: 'batch-merge-pdfs', tool_name: 'Batch Merge PDFs',
      status: 'error', input_filename: null, error_message: err.message, duration_ms: Date.now() - startedAt,
    });
    return res.json({ success: false, error: err.message }, 500);
  }
};
