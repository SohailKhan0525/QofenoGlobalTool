import { Client, Databases, Query, Storage, ID, Permission, Role } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import JSZip from 'jszip';
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

async function readInputBuffer(fileInput) {
  const direct = decodeFileInput(fileInput.file_base64 || fileInput.input_base64 || fileInput.data_base64 || fileInput.file);
  if (direct) return direct;
  if (fileInput.file_id && fileInput.bucket_id) {
    const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '');
    const response = await fetch(`${endpoint}/storage/buckets/${fileInput.bucket_id}/files/${fileInput.file_id}/download`, {
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

function compressWithGhostscript(inputPath, outputPath, level, log) {
  const settings = { low: '/prepress', medium: '/ebook', high: '/screen', maximum: '/screen' };
  const dcsettings = level === 'maximum'
    ? '-dColorImageDownsampleThreshold=1.0 -dGrayImageDownsampleThreshold=1.0 -dMonoImageDownsampleThreshold=1.0' : '';
  const cmd = [
    'gs', '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.4', `-dPDFSETTINGS=${settings[level] || '/ebook'}`,
    '-dNOPAUSE', '-dQUIET', '-dBATCH', dcsettings, '-dAutoRotatePages=/None',
    '-dCompressFonts=true', '-dEmbedAllFonts=true', `-sOutputFile=${outputPath}`, inputPath,
  ].filter(Boolean).join(' ');
  log(`Running GS: ${cmd}`);
  execSync(cmd, { stdio: 'pipe', timeout: 60000 });
}

export default async ({ req, res, log, error }) => {
  const body = parseBody(req);
  const client = new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
  const storage = new Storage(client);
  const db = new Databases(client);
  const startedAt = Date.now();
  const slug = 'batch-compress-pdfs';

  // RATE LIMITING
  const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown_ip';
  const hourKey = `${clientIp}_${Math.floor(Date.now() / 3600000)}`;
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

  let tmpDir = null;

  try {
    const filesInput = body.files || [];
    if (!Array.isArray(filesInput) || filesInput.length === 0) {
      throw new Error("No files provided for batch compression.");
    }

    const compressionLevel = String(body.compression_level || 'medium').toLowerCase();
    tmpDir = mkdtempSync(join(tmpdir(), 'qofeno-batch-compress-'));
    
    const zip = new JSZip();
    let totalInputSize = 0;

    for (let i = 0; i < filesInput.length; i++) {
      const fileInput = filesInput[i];
      const source = await readInputBuffer(fileInput);
      totalInputSize += source.buffer.length;
      const inputName = String(fileInput.input_filename || fileInput.filename || `input_${i+1}.pdf`);
      
      const inPath = join(tmpDir, `in_${i}.pdf`);
      const outPath = join(tmpDir, `out_${i}.pdf`);
      writeFileSync(inPath, source.buffer);

      compressWithGhostscript(inPath, outPath, compressionLevel, log);

      if (!existsSync(outPath)) throw new Error(`Failed to compress ${inputName}`);
      const outBuffer = readFileSync(outPath);
      
      const outName = inputName.replace(/\\.pdf$/i, '') + '-compressed.pdf';
      zip.file(outName, outBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "STORE" });
    const outputName = `qofeno-batch-compressed-${Date.now()}.zip`;

    const uploaded = await uploadOutput(storage, outputName, zipBuffer);
    
    await db.createDocument(process.env.DATABASE_ID, 'tool_executions', ID.unique(), {
      user_id: body.user_id || null, tool_slug: slug, tool_name: slug,
      status: 'completed', input_filename: 'batch_files.zip',
      input_size: totalInputSize, output_filename: outputName, output_size: zipBuffer.length,
      download_url: uploaded.download_url, duration_ms: Date.now() - startedAt,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    });

    return res.json({
      success: true, output_filename: outputName, output_size: zipBuffer.length,
      download_url: uploaded.download_url, file_id: uploaded.file.$id, duration_ms: Date.now() - startedAt,
    });
  } catch (err) {
    error(err.message);
    return res.json({ success: false, error: err.message }, 500);
  } finally {
    if (tmpDir && existsSync(tmpDir)) {
      try { require('fs').rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
    }
  }
};
