import { Client, Databases, Query, Storage, ID, Permission, Role } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
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

export default async ({ req, res, log, error }) => {
  const body = parseBody(req);
  const client = new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
  const storage = new Storage(client);
  const db = new Databases(client);
  const startedAt = Date.now();
  const slug = 'pdf-color-converter';

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
    const source = await readInputBuffer(body);
    const inputName = String(body.input_filename || body.filename || 'input.pdf');
    const colorProfile = String(body.color_profile || 'cmyk').toLowerCase(); // cmyk, rgb, gray

    tmpDir = mkdtempSync(join(tmpdir(), 'qofeno-color-'));
    const inPath = join(tmpDir, 'in.pdf');
    const outPath = join(tmpDir, 'out.pdf');
    writeFileSync(inPath, source.buffer);

    let gsProfileArgs = '';
    if (colorProfile === 'cmyk') {
      gsProfileArgs = '-sColorConversionStrategy=CMYK -dProcessColorModel=/DeviceCMYK';
    } else if (colorProfile === 'gray' || colorProfile === 'grayscale') {
      gsProfileArgs = '-sColorConversionStrategy=Gray -dProcessColorModel=/DeviceGray';
    } else {
      gsProfileArgs = '-sColorConversionStrategy=RGB -dProcessColorModel=/DeviceRGB';
    }

    const cmd = [
      'gs', '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.4',
      '-dNOPAUSE', '-dQUIET', '-dBATCH',
      gsProfileArgs,
      `-sOutputFile=${outPath}`, inPath
    ].join(' ');

    log(`Running GS Color Conversion: ${cmd}`);
    execSync(cmd, { stdio: 'pipe', timeout: 120000 });

    if (!existsSync(outPath)) throw new Error('Color conversion failed');
    const outBuf = readFileSync(outPath);

    const outName = inputName.replace(/\.pdf$/i, '') + `-${colorProfile}.pdf`;

    const uploaded = await uploadOutput(storage, outName, outBuf);
    await createExecutionRecord(db, {
      user_id: body.user_id || null, tool_slug: slug, tool_name: slug,
      status: 'completed', input_filename: inputName,
      input_size: source.buffer.length, output_filename: outName, output_size: outBuf.length,
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
      status: 'error', input_filename: body.input_filename || body.filename || null,
      error_message: err.message, duration_ms: Date.now() - startedAt,
    });
    return res.json({ success: false, error: err.message }, 500);
  } finally {
    if (tmpDir && existsSync(tmpDir)) {
      try { require('fs').rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
    }
  }
};
