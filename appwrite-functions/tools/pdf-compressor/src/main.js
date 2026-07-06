/**
 * pdf-compressor — Real PDF compression using Ghostscript CLI (with pdf-lib fallback).
 * Supports compression_level: low | medium | high | maximum
 */
import { Client, Databases, Query, ID, Permission, Role, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { PDFDocument } from 'pdf-lib';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, unlinkSync, mkdtempSync } from 'fs';
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

function isGhostscriptAvailable() {
  try {
    execSync('gs --version', { stdio: 'pipe', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Compress PDF using Ghostscript — the gold standard for PDF compression.
 * /screen  = 72 dpi images, smallest size
 * /ebook   = 150 dpi images, good balance
 * /printer = 300 dpi, high quality
 * /prepress = 300 dpi, max quality (least compression)
 */
function compressWithGhostscript(inputPath, outputPath, level, log) {
  const settings = {
    low: '/prepress',
    medium: '/ebook',
    high: '/screen',
    maximum: '/screen',
  };
  const dcsettings = level === 'maximum'
    ? '-dColorImageDownsampleThreshold=1.0 -dGrayImageDownsampleThreshold=1.0 -dMonoImageDownsampleThreshold=1.0'
    : '';

  const cmd = [
    'gs',
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.4',
    `-dPDFSETTINGS=${settings[level] || '/ebook'}`,
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    dcsettings,
    '-dAutoRotatePages=/None',
    '-dCompressFonts=true',
    '-dEmbedAllFonts=true',
    `-sOutputFile=${outputPath}`,
    inputPath,
  ].filter(Boolean).join(' ');

  log(`Running Ghostscript compression [${level}]: ${cmd}`);
  execSync(cmd, { stdio: 'pipe', timeout: 120000 });
}

/**
 * Fallback: use pdf-lib's object stream optimization.
 * Less effective than Ghostscript but always available.
 */
async function compressWithPdfLib(inputBuffer, level) {
  const pdfDoc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
  // Remove metadata to save space at higher compression
  if (level === 'high' || level === 'maximum') {
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('Qofeno PDF Compressor');
    pdfDoc.setCreator('Qofeno');
  }
  return Buffer.from(await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false }));
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
  let tmpDir = null;

  try {
    const source = await readInputBuffer(body);
    const inputName = String(body.input_filename || body.filename || 'input.pdf');
    const compressionLevel = String(body.compression_level || body.level || 'medium').toLowerCase();
    const validLevels = ['low', 'medium', 'high', 'maximum'];
    const level = validLevels.includes(compressionLevel) ? compressionLevel : 'medium';

    log(`PDF Compressor: file=${inputName}, size=${source.buffer.length}, level=${level}`);

    const { outputBuffer, outputName, method } = await processWithRetry(async () => {
      let outBuf;
      let usedMethod = 'pdf-lib';

      if (isGhostscriptAvailable()) {
        // Use Ghostscript for best compression
        tmpDir = mkdtempSync(join(tmpdir(), 'qofeno-compress-'));
        const inputPath = join(tmpDir, 'input.pdf');
        const outputPath = join(tmpDir, 'output.pdf');
        writeFileSync(inputPath, source.buffer);
        compressWithGhostscript(inputPath, outputPath, level, log);
        if (!existsSync(outputPath)) throw new Error('Ghostscript compression failed: output file not created');
        outBuf = readFileSync(outputPath);
        usedMethod = 'ghostscript';
      } else {
        log('Ghostscript not available, using pdf-lib fallback');
        outBuf = await compressWithPdfLib(source.buffer, level);
      }

      const outName = inputName.replace(/\.pdf$/i, '') + '-compressed.pdf';

      // Validate output
      if (!outBuf || outBuf.length === 0) throw new Error('Output file is empty — compression failed');
      const header = outBuf.toString('utf8', 0, 5);
      if (header !== '%PDF-') throw new Error('Output is not a valid PDF file');

      const reduction = Math.round((1 - outBuf.length / source.buffer.length) * 100);
      log(`Compressed [${usedMethod}] ${level}: ${source.buffer.length} → ${outBuf.length} bytes (${reduction}% reduction)`);

      return { outputBuffer: outBuf, outputName: outName, method: usedMethod };
    });

    const uploaded = await uploadOutput(storage, outputName, outputBuffer);

    await createExecutionRecord(db, {
      user_id: body.user_id || null,
      tool_slug: 'pdf-compressor',
      tool_name: 'PDF Compressor',
      status: 'completed',
      input_filename: inputName,
      input_size: source.buffer.length,
      output_filename: outputName,
      output_size: outputBuffer.length,
      download_url: uploaded.download_url,
      duration_ms: Date.now() - startedAt,
    });

    return res.json({
      success: true,
      output_filename: outputName,
      output_size: outputBuffer.length,
      input_size: source.buffer.length,
      compression_ratio: Math.round((1 - outputBuffer.length / source.buffer.length) * 100),
      compression_level: level,
      method,
      download_url: uploaded.download_url,
      file_id: uploaded.file.$id,
      duration_ms: Date.now() - startedAt,
    });
  } catch (err) {
    error(err.message);
    await createExecutionRecord(db, {
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
    // Cleanup tmp files
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
