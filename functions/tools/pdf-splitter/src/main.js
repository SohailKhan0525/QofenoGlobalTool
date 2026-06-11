import { Client, Databases, ID, Permission, Role, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { PDFDocument } from 'pdf-lib';

function parseBody(req) {
  const raw = req.body || req.payload || '{}';
  if (typeof raw !== 'string') return raw || {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function decodeFileInput(value) {
  if (typeof value !== 'string' || !value) return null;
  const match = value.match(/^data:([^;]+);base64,(.*)$/i);
  const base64 = match ? match[2] : value;
  return { buffer: Buffer.from(base64, 'base64') };
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
    if (!response.ok) {
      throw new Error(`Unable to download source file: ${response.status}`);
    }
    return { buffer: Buffer.from(await response.arrayBuffer()) };
  }

  throw new Error('file_base64 or file_id + bucket_id is required');
}

function parseRanges(rangeText, totalPages) {
  if (!rangeText) {
    return Array.from({ length: totalPages }, (_, index) => [index + 1, index + 1]);
  }

  return String(rangeText)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [startRaw, endRaw] = part.split('-').map((value) => value.trim());
      const start = Math.max(1, Number(startRaw || 1));
      const end = Math.min(totalPages, Number(endRaw || start));
      return [Math.min(start, end), Math.max(start, end)];
    })
    .filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end) && start >= 1 && end >= start && start <= totalPages);
}

async function createExecution(db, payload) {
  return db.createDocument(process.env.DATABASE_ID, 'tool_executions', ID.unique(), {
    user_id: payload.user_id || null,
    tool_slug: payload.tool_slug,
    tool_name: payload.tool_name,
    category: payload.category,
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
}

async function uploadOutput(storage, filename, buffer) {
  const file = await storage.createFile(process.env.BUCKET_OUTPUTS, ID.unique(), InputFile.fromBuffer(buffer, filename), [Permission.read(Role.any()), Permission.delete(Role.any())]);
  const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '');
  return {
    file,
    download_url: `${endpoint}/storage/buckets/${process.env.BUCKET_OUTPUTS}/files/${file.$id}/download?project=${process.env.APPWRITE_PROJECT_ID}`,
  };
}

async function processWithRetry(processFn, maxRetries = 2) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await processFn();
    } catch (err) {
      lastError = err;
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw lastError;
}

export default async ({ req, res, error }) => {
  const body = parseBody(req);
  const client = new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
  const storage = new Storage(client);
  const db = new Databases(client);
  const startedAt = Date.now();

  try {
    const source = await readInputBuffer(body);
    const inputName = String(body.input_filename || body.filename || 'input.pdf');
    const outputs = await processWithRetry(async () => {
      const pdf = await PDFDocument.load(source.buffer, { ignoreEncryption: true });
      const ranges = parseRanges(body.page_ranges || body.ranges, pdf.getPageCount());
      const outs = [];

      for (const [startPage, endPage] of ranges) {
        const target = await PDFDocument.create();
        const copied = await target.copyPages(pdf, Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage - 1 + index));
        copied.forEach((page) => target.addPage(page));
        const outputBuffer = await target.save({ useObjectStreams: true });
        const outputName = `${inputName.replace(/\.pdf$/i, '')}-pages-${startPage}-${endPage}.pdf`;
        
        if (outputBuffer.toString('utf8', 0, 5) !== '%PDF-') {
          throw new Error("Output is not a valid PDF file");
        }
        
        const uploaded = await uploadOutput(storage, outputName, outputBuffer);
        outs.push({
          page_start: startPage,
          page_end: endPage,
          output_filename: outputName,
          output_size: outputBuffer.length,
          download_url: uploaded.download_url,
          file_id: uploaded.file.$id,
        });
      }
      return outs;
    });

    const firstOutput = outputs[0] || null;
    await createExecution(db, {
      user_id: body.user_id || null,
      tool_slug: 'pdf-splitter',
      tool_name: 'PDF Splitter',
      category: 'PDF & Documents',
      status: 'completed',
      input_filename: inputName,
      input_size: source.buffer.length,
      output_filename: firstOutput?.output_filename || null,
      output_size: firstOutput?.output_size || null,
      download_url: firstOutput?.download_url || null,
      duration_ms: Date.now() - startedAt,
    });

    return res.json({
      success: true,
      outputs,
      duration_ms: Date.now() - startedAt,
    });
  } catch (err) {
    error(err.message);
    try {
      await createExecution(db, {
        user_id: body.user_id || null,
        tool_slug: 'pdf-splitter',
        tool_name: 'PDF Splitter',
        category: 'PDF & Documents',
        status: 'error',
        input_filename: body.input_filename || body.filename || null,
        error_message: err.message,
        duration_ms: Date.now() - startedAt,
      });
    } catch {
    }
    return res.json({ success: false, error: err.message }, 500);
  }
}
