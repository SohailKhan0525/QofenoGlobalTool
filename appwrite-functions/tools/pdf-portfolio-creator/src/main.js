import { Client, Databases, Query, Storage, ID, Permission, Role } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { PDFDocument, rgb } from 'pdf-lib';

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
  const mimeType = match ? match[1] : 'application/pdf';
  return { buffer: Buffer.from(base64, 'base64'), mimeType };
}

async function readInputBuffer(fileInput) {
  const direct = decodeFileInput(fileInput.file_base64 || fileInput.input_base64 || fileInput.data_base64 || fileInput.file);
  if (direct) return direct;
  if (fileInput.file_id && fileInput.bucket_id) {
    const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\\/$/, '');
    const response = await fetch(\`\${endpoint}/storage/buckets/\${fileInput.bucket_id}/files/\${fileInput.file_id}/download\`, {
      headers: { 'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID, 'X-Appwrite-Key': process.env.APPWRITE_API_KEY },
    });
    if (!response.ok) throw new Error(\`Unable to download source file: \${response.status}\`);
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
  const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\\/$/, '');
  return { file, download_url: \`\${endpoint}/storage/buckets/\${process.env.BUCKET_OUTPUTS}/files/\${file.$id}/download?project=\${process.env.APPWRITE_PROJECT_ID}\` };
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

export default async ({ req, res, log, error }) => {
  const body = parseBody(req);
  const client = new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
  const storage = new Storage(client);
  const db = new Databases(client);
  const startedAt = Date.now();
  const slug = 'pdf-portfolio-creator';

  // RATE LIMITING
  const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown_ip';
  const hourKey = \`\${clientIp}_\${Math.floor(Date.now() / 3600000)}\`;
  let isProUser = false;
  if (body.user_id) {
    try {
      const userMeta = await db.getDocument(process.env.DATABASE_ID, 'users_meta', body.user_id);
      if (userMeta && (userMeta.plan === 'pro' || userMeta.plan === 'enterprise')) isProUser = true;
    } catch (err) { /* ignore */ }
  }
  const limit = isProUser ? 100 : 20;
  try {
    const existing = await db.listDocuments(process.env.DATABASE_ID, 'rate_limits', [Query.equal('key', hourKey)]);
    if (existing.total > 0) {
      if (existing.documents[0].count >= limit) return res.json({ success: false, error: "Rate limit exceeded." }, 429);
      await db.updateDocument(process.env.DATABASE_ID, 'rate_limits', existing.documents[0].$id, { count: existing.documents[0].count + 1, updated_at: new Date().toISOString() });
    } else {
      await db.createDocument(process.env.DATABASE_ID, 'rate_limits', ID.unique(), { key: hourKey, ip: clientIp, count: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
  } catch (err) { log('Rate limit check failed: ' + err.message); }
  // END RATE LIMITING

  try {
    const filesInput = body.files || [];
    if (!Array.isArray(filesInput) || filesInput.length === 0) {
      // Allow fallback to single file if provided
      if (body.file_base64 || body.file_id) {
        filesInput.push({
          file_base64: body.file_base64,
          file_id: body.file_id,
          bucket_id: body.bucket_id,
          input_filename: body.input_filename || body.filename || 'input.pdf'
        });
      } else {
        throw new Error("No files provided to create portfolio.");
      }
    }

    const pdfDoc = await PDFDocument.create();
    const coverPage = pdfDoc.addPage([595, 842]); // A4
    coverPage.drawText('Qofeno PDF Portfolio', { x: 50, y: 750, size: 24, color: rgb(0.4, 0, 0.8) });
    coverPage.drawText('This document contains embedded files.', { x: 50, y: 700, size: 14 });
    coverPage.drawText(\`Total embedded files: \${filesInput.length}\`, { x: 50, y: 670, size: 12 });

    let totalInputSize = 0;
    for (let i = 0; i < filesInput.length; i++) {
      const fileInput = filesInput[i];
      const source = await readInputBuffer(fileInput);
      totalInputSize += source.buffer.length;
      const inputName = String(fileInput.input_filename || fileInput.filename || \`attachment_\${i+1}.pdf\`);
      
      await pdfDoc.attach(source.buffer, inputName, {
        mimeType: source.mimeType || 'application/pdf',
        description: \`Portfolio Attachment \${i+1}\`,
        creationDate: new Date(),
        modificationDate: new Date()
      });
      
      coverPage.drawText(\`- \${inputName}\`, { x: 50, y: 640 - (i * 20), size: 12 });
    }

    const outBuf = Buffer.from(await pdfDoc.save({ useObjectStreams: true }));
    const outName = \`qofeno-portfolio-\${Date.now()}.pdf\`;

    const uploaded = await uploadOutput(storage, outName, outBuf);
    await createExecutionRecord(db, {
      user_id: body.user_id || null, tool_slug: slug, tool_name: slug,
      status: 'completed', input_filename: 'Multiple Files',
      input_size: totalInputSize, output_filename: outName, output_size: outBuf.length,
      download_url: uploaded.download_url, duration_ms: Date.now() - startedAt,
    });

    return res.json({
      success: true, output_filename: outName, output_size: outBuf.length,
      download_url: uploaded.download_url, file_id: uploaded.file.$id, duration_ms: Date.now() - startedAt,
    });
  } catch (err) {
    error(err.message);
    await createExecutionRecord(db, {
      user_id: body.user_id || null, tool_slug: slug, tool_name: slug,
      status: 'error', input_filename: 'Multiple Files',
      error_message: err.message, duration_ms: Date.now() - startedAt,
    });
    return res.json({ success: false, error: err.message }, 500);
  }
};
