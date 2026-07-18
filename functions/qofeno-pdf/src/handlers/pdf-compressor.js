/**
 * pdf-compressor — Real PDF compression using Ghostscript CLI (with pdf-lib fallback).
 * Supports compression_level: low | medium | high | maximum
 */
import { Client, Databases, ID, Permission, Role, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { PDFDocument } from 'pdf-lib';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, unlinkSync, mkdtempSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

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

async function readInputBuffer(body) {
  if (body.file_base64 || body.input_base64 || body.data_base64 || body.file) {
    const raw = body.file_base64 || body.input_base64 || body.data_base64 || body.file;
    const match = raw.match(/^data:([^;]+);base64,(.*)$/i);
    const base64 = match ? match[2] : raw;
    return { buffer: Buffer.from(base64, 'base64'), mimeType: 'application/pdf' };
  }
  if (body.file_id && body.bucket_id) {
    const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '');
    const response = await fetch(`${endpoint}/storage/buckets/${body.bucket_id}/files/${body.file_id}/download`, {
      headers: {
        'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': process.env.APPWRITE_API_KEY,
      },
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
  return {
    file,
    download_url: `${endpoint}/storage/buckets/${process.env.BUCKET_OUTPUTS}/files/${file.$id}/download?project=${process.env.APPWRITE_PROJECT_ID}`,
  };
}

async function createExecutionRecord(db, payload) {
  try {
    return await db.createDocument(process.env.DATABASE_ID, 'tool_executions', ID.unique(), {
      user_id: payload.user_id || null,
      tool_slug: payload.tool_slug,
      tool_name: payload.tool_name,
      category: payload.category || 'PDF & Documents',
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

function isGhostscriptAvailable() {
  try {
    execSync('gs --version', { stdio: 'pipe', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

function compressWithGhostscript(inputPath, outputPath, level, log) {
  const settings = {
    low: '/prepress',
    medium: '/ebook',
    high: '/screen',
    maximum: '/screen',
  };
  const extra = level === 'maximum'
    ? '-dColorImageDownsampleThreshold=1.0 -dGrayImageDownsampleThreshold=1.0'
    : '';

  const cmd = [
    'gs',
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.4',
    `-dPDFSETTINGS=${settings[level] || '/ebook'}`,
    '-dNOPAUSE', '-dQUIET', '-dBATCH',
    extra,
    '-dAutoRotatePages=/None',
    '-dCompressFonts=true',
    '-dEmbedAllFonts=true',
    `-sOutputFile=${outputPath}`,
    inputPath,
  ].filter(Boolean).join(' ');

  if (log) log(`Running Ghostscript compression [${level}]`);
  execSync(cmd, { stdio: 'pipe', timeout: 120000 });
}

async function compressWithPdfLib(inputBuffer, level) {
  const pdfDoc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
  if (level === 'high' || level === 'maximum') {
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('Qofeno');
    pdfDoc.setCreator('Qofeno');
  }
  return Buffer.from(await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false }));
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
    const compressionLevel = String(body.compression_level || body.level || 'Medium').toLowerCase();
    const validLevels = ['low', 'medium', 'high', 'maximum'];
    const level = validLevels.includes(compressionLevel) ? compressionLevel : 'medium';

    if (log) log(`PDF Compressor: file=${inputName}, size=${source.buffer.length}, level=${level}`);

    let outputBuffer;
    let usedMethod = 'pdf-lib';

    if (isGhostscriptAvailable()) {
      tmpDir = mkdtempSync(join(tmpdir(), 'qofeno-compress-'));
      const inputPath = join(tmpDir, 'input.pdf');
      const outputPath = join(tmpDir, 'output.pdf');
      writeFileSync(inputPath, source.buffer);
      compressWithGhostscript(inputPath, outputPath, level, log);
      if (existsSync(outputPath) && statSync(outputPath).size > 0) {
        const gsOut = readFileSync(outputPath);
        // Only use GS output if it's actually smaller
        outputBuffer = gsOut.length < source.buffer.length ? gsOut : await compressWithPdfLib(source.buffer, level);
      } else {
        outputBuffer = await compressWithPdfLib(source.buffer, level);
      }
      usedMethod = 'ghostscript';
    } else {
      outputBuffer = await compressWithPdfLib(source.buffer, level);
      usedMethod = 'pdf-lib';
    }

    const outName = inputName.replace(/\.pdf$/i, '') + '-compressed.pdf';

    if (!outputBuffer || outputBuffer.length === 0) throw new Error('Output file is empty');
    if (outputBuffer.toString('utf8', 0, 5) !== '%PDF-') throw new Error('Output is not a valid PDF');

    const reduction = Math.max(0, Math.round((1 - outputBuffer.length / source.buffer.length) * 100));
    if (log) log(`Compressed [${usedMethod}]: ${source.buffer.length} → ${outputBuffer.length} bytes (${reduction}% reduction)`);

    const uploaded = await uploadOutput(storage, outName, outputBuffer);

    await createExecutionRecord(db, {
      user_id: body.user_id || null,
      tool_slug: 'pdf-compressor',
      tool_name: 'PDF Compressor',
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
      compression_level: level,
      method: usedMethod,
      download_url: uploaded.download_url,
      file_id: uploaded.file.$id,
      duration_ms: Date.now() - startedAt,
    });
  } catch (err) {
    if (error) error(err.message);
    const db2 = new Databases(new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY));
    await createExecutionRecord(db2, {
      user_id: body.user_id || null,
      tool_slug: 'pdf-compressor',
      tool_name: 'PDF Compressor',
      status: 'error',
      input_filename: body.input_filename || body.filename || null,
      error_message: err.message,
      duration_ms: Date.now() - startedAt,
    });
    return res.json({ success: false, error: err.message }, 500);
  } finally {
    if (tmpDir) {
      try {
        ['input.pdf', 'output.pdf'].forEach(f => {
          const p = join(tmpDir, f);
          if (existsSync(p)) unlinkSync(p);
        });
      } catch (_) {}
    }
  }
};
