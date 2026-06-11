import { Client, Databases, ID, Permission, Role, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { PDFDocument, degrees } from 'pdf-lib';

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
    
    // Retry logic wrapper
    const { outputBuffer, outputName } = await processWithRetry(async () => {
      // Logic for pdf-rotate
      const inputPdf = await PDFDocument.load(source.buffer, { ignoreEncryption: true });
      
      const pages = inputPdf.getPages();
      const totalPages = pages.length;
      
      const rotationStr = body.rotation || '90° Clockwise';
      let deg = 90;
      if (rotationStr.includes('180')) deg = 180;
      else if (rotationStr.includes('Counter')) deg = 270;
      
      const applyTo = body.apply_to || 'All pages';
      
      // Parse specific pages if needed
      const specificSet = new Set();
      if (applyTo === 'Specific pages' && body.specific_pages) {
        body.specific_pages.split(',').forEach(part => {
          const range = part.trim().split('-');
          if (range.length === 2) {
            let start = parseInt(range[0], 10);
            let end = parseInt(range[1], 10);
            if (!isNaN(start) && !isNaN(end)) {
              for (let i = start; i <= end; i++) specificSet.add(i);
            }
          } else {
            let p = parseInt(part.trim(), 10);
            if (!isNaN(p)) specificSet.add(p);
          }
        });
      }

      pages.forEach((page, index) => {
        const pageNum = index + 1;
        let shouldRotate = false;
        
        if (applyTo === 'All pages') shouldRotate = true;
        else if (applyTo === 'Odd pages' && pageNum % 2 !== 0) shouldRotate = true;
        else if (applyTo === 'Even pages' && pageNum % 2 === 0) shouldRotate = true;
        else if (applyTo === 'Specific pages' && specificSet.has(pageNum)) shouldRotate = true;
        
        if (shouldRotate) {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees(currentRotation + deg));
        }
      });

      const outputBuffer = await inputPdf.save();
      const outputName = inputName.replace(/\\.[^/.]+$/, "") + '-rotated.pdf';
      
      // Validation
      if (outputName.endsWith('.pdf')) {
        if (outputBuffer.toString('utf8', 0, 5) !== '%PDF-') {
          throw new Error("Output is not a valid PDF file");
        }
      }
      
      return { outputBuffer, outputName };
    });

    const uploaded = await uploadOutput(storage, outputName, outputBuffer);

    await createExecution(db, {
      user_id: body.user_id || null,
      tool_slug: 'pdf-rotate',
      tool_name: 'pdf-rotate',
      category: 'PDF & Documents',
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
      download_url: uploaded.download_url,
      file_id: uploaded.file.$id,
      duration_ms: Date.now() - startedAt,
    });
  } catch (err) {
    error(err.message);
    try {
      await createExecution(db, {
        user_id: body.user_id || null,
        tool_slug: 'pdf-rotate',
        tool_name: 'pdf-rotate',
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
