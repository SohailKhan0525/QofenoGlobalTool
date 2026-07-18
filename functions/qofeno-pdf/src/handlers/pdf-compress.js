/**
 * pdf-compress — Real PDF compression using Ghostscript (pdf-lib fallback).
 * compression_level: low | medium | high | maximum
 */
import { Client, Databases, ID, Permission, Role, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { PDFDocument } from 'pdf-lib';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, unlinkSync, statSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

function parseBody(req) {
  if (req.bodyRaw && typeof req.bodyRaw === 'string') {
    try { return JSON.parse(req.bodyRaw); } catch { /* ignore */ }
  }
  if (req.body && typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { /* ignore */ }
  }
  if (typeof req.body === 'object' && req.body !== null) { return req.body; }
  return {};
}

async function readInputBuffer(body) {
  const raw = body.file_base64 || body.input_base64 || body.data_base64 || body.file;
  if (raw) {
    const match = raw.match(/^data:([^;]+);base64,(.*)$/i);
    const base64 = match ? match[2] : raw;
    return { buffer: Buffer.from(base64, 'base64') };
  }
  if (body.file_id && body.bucket_id) {
    const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '');
    const resp = await fetch(`${endpoint}/storage/buckets/${body.bucket_id}/files/${body.file_id}/download`, {
      headers: { 'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID, 'X-Appwrite-Key': process.env.APPWRITE_API_KEY },
    });
    if (!resp.ok) throw new Error(`Unable to download source file: ${resp.status}`);
    return { buffer: Buffer.from(await resp.arrayBuffer()) };
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
  return {
    file,
    download_url: `${endpoint}/storage/buckets/${process.env.BUCKET_OUTPUTS}/files/${file.$id}/download?project=${process.env.APPWRITE_PROJECT_ID}`,
  };
}

async function safeCreateExecution(db, payload) {
  try {
    await db.createDocument(process.env.DATABASE_ID, 'tool_executions', ID.unique(), {
      user_id: payload.user_id || null,
      tool_slug: payload.tool_slug,
      tool_name: payload.tool_name,
      category: 'PDF & Documents',
      status: payload.status,
      input_filename: payload.input_filename || null,
      input_size: payload.input_size || null,
      output_filename: payload.output_filename || null,
      output_size: payload.output_size || null,
      download_url: payload.download_url || null,
      error_message: payload.error_message || null,
      duration_ms: payload.duration_ms || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (_) {}
}

function isGsAvailable() {
  try { execSync('gs --version', { stdio: 'pipe', timeout: 5000 }); return true; } catch { return false; }
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
  let tmpDir = null;

  try {
    const source = await readInputBuffer(body);
    const inputName = String(body.input_filename || body.filename || 'input.pdf');
    const level = ['low', 'medium', 'high', 'maximum'].includes(
      String(body.compression_level || 'medium').toLowerCase()
    ) ? String(body.compression_level || 'medium').toLowerCase() : 'medium';

    if (log) log(`pdf-compress: ${inputName} ${source.buffer.length}B level=${level}`);

    let outputBuffer;
    let method = 'pdf-lib';

    if (isGsAvailable()) {
      tmpDir = mkdtempSync(join(tmpdir(), 'qofeno-compress-'));
      const inputPath = join(tmpDir, 'input.pdf');
      const outputPath = join(tmpDir, 'output.pdf');
      writeFileSync(inputPath, source.buffer);
      const gsSettings = { low: '/prepress', medium: '/ebook', high: '/screen', maximum: '/screen' };
      execSync(
        `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${gsSettings[level]} -dNOPAUSE -dQUIET -dBATCH -dAutoRotatePages=/None -dCompressFonts=true -sOutputFile="${outputPath}" "${inputPath}"`,
        { stdio: 'pipe', timeout: 120000 }
      );
      if (existsSync(outputPath) && statSync(outputPath).size > 0) {
        const gsOut = readFileSync(outputPath);
        outputBuffer = gsOut.length < source.buffer.length ? gsOut : Buffer.from(
          await (await PDFDocument.load(source.buffer, { ignoreEncryption: true })).save({ useObjectStreams: true })
        );
        method = 'ghostscript';
      } else {
        const doc = await PDFDocument.load(source.buffer, { ignoreEncryption: true });
        outputBuffer = Buffer.from(await doc.save({ useObjectStreams: true }));
      }
    } else {
      const doc = await PDFDocument.load(source.buffer, { ignoreEncryption: true });
      if (level === 'high' || level === 'maximum') {
        doc.setTitle(''); doc.setAuthor(''); doc.setSubject(''); doc.setKeywords([]);
      }
      outputBuffer = Buffer.from(await doc.save({ useObjectStreams: true }));
    }

    const outName = inputName.replace(/\.pdf$/i, '') + '-compressed.pdf';
    if (!outputBuffer || outputBuffer.length === 0) throw new Error('Output is empty');
    if (outputBuffer.toString('utf8', 0, 5) !== '%PDF-') throw new Error('Output is not a valid PDF');

    const reduction = Math.max(0, Math.round((1 - outputBuffer.length / source.buffer.length) * 100));

    const uploaded = await uploadOutput(storage, outName, outputBuffer);
    await safeCreateExecution(db, {
      user_id: body.user_id || null,
      tool_slug: 'pdf-compress',
      tool_name: 'Compress PDF',
      status: 'completed',
      input_filename: inputName,
      input_size: source.buffer.length,
      output_filename: outName,
      output_size: outputBuffer.length,
      download_url: uploaded.download_url,
      duration_ms: Date.now() - startedAt,
    });

    return res.json({
      success: true,
      output_filename: outName,
      output_size: outputBuffer.length,
      input_size: source.buffer.length,
      compression_ratio: reduction,
      method,
      download_url: uploaded.download_url,
      file_id: uploaded.file.$id,
      duration_ms: Date.now() - startedAt,
    });
  } catch (err) {
    if (error) error(err.message);
    const db2 = new Databases(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));
    await safeCreateExecution(db2, {
      user_id: body.user_id || null,
      tool_slug: 'pdf-compress',
      tool_name: 'Compress PDF',
      status: 'error',
      input_filename: body.input_filename || body.filename || null,
      error_message: err.message,
      duration_ms: Date.now() - startedAt,
    });
    return res.json({ success: false, error: err.message }, 500);
  } finally {
    if (tmpDir) {
      try {
        ['input.pdf', 'output.pdf'].forEach(f => { try { unlinkSync(join(tmpDir, f)); } catch (_) {} });
      } catch (_) {}
    }
  }
};
