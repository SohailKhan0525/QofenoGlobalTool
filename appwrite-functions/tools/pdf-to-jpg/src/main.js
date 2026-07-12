import { Client, Databases, Query, ID, Permission, Role, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { createCanvas } = require('canvas');

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
    if (!response.ok) {
      throw new Error(`Unable to download source file: ${response.status}`);
    }
    return { buffer: Buffer.from(await response.arrayBuffer()), mimeType: 'application/pdf' };
  }

  throw new Error('file_base64 or file_id + bucket_id is required');
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
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(source.buffer) });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const pagesStr = body.pages || 'All';
      let pagesToConvert = [];

      if (pagesStr === 'All') {
        for (let i = 1; i <= numPages; i++) pagesToConvert.push(i);
      } else {
        pagesStr.split(',').forEach(part => {
          const range = part.trim().split('-');
          if (range.length === 2) {
            let start = parseInt(range[0], 10);
            let end = parseInt(range[1], 10);
            if (!isNaN(start) && !isNaN(end)) {
              for (let i = start; i <= end; i++) pagesToConvert.push(i);
            }
          } else {
            let p = parseInt(part.trim(), 10);
            if (!isNaN(p)) pagesToConvert.push(p);
          }
        });
      }

      pagesToConvert = pagesToConvert.filter(p => p >= 1 && p <= numPages);

      const quality = (parseInt(body.quality, 10) || 90) / 100;
      const dpi = parseInt(body.dpi, 10) || 300;
      const scale = dpi / 72;

      const outs = [];

      for (const pageNum of pagesToConvert) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        const canvas = createCanvas(viewport.width, viewport.height);
        const ctx = canvas.getContext('2d');
        
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };
        
        await page.render(renderContext).promise;
        
        const jpegBuffer = canvas.toBuffer('image/jpeg', { quality });
        const outputName = `${inputName.replace(/\.pdf$/i, '')}-page-${pageNum}.jpg`;
        
        const uploaded = await uploadOutput(storage, outputName, jpegBuffer);
        outs.push({
          page_start: pageNum,
          page_end: pageNum,
          output_filename: outputName,
          output_size: jpegBuffer.length,
          download_url: uploaded.download_url,
          file_id: uploaded.file.$id,
        });
      }
      return outs;
    });

    const firstOutput = outputs[0] || null;

    await createExecution(db, {
      user_id: body.user_id || null,
      tool_slug: 'pdf-to-jpg',
      tool_name: 'PDF to JPG',
      category: 'PDF & Documents',
      status: 'completed',
      input_filename: inputName,
      input_size: source.buffer.length,
      output_filename: firstOutput ? firstOutput.output_filename : null,
      output_size: firstOutput ? firstOutput.output_size : null,
      download_url: firstOutput ? firstOutput.download_url : null,
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
        tool_slug: 'pdf-to-jpg',
        tool_name: 'pdf-to-jpg',
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
