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
    const fileItems = Array.isArray(body.files) && body.files.length ? body.files : Array.isArray(body.inputs) ? body.inputs : [];
    if (!fileItems.length) {
      throw new Error('files array is required');
    }

    const { outputBuffer, outputName, inputSize, inputNames } = await processWithRetry(async () => {
      const merged = await PDFDocument.create();
      const names = [];
      let size = 0;

      const pageSize = body.page_size || 'A4';
      const margin = body.margin || 'None';
      let marginPts = 0;
      if (margin === 'Small') marginPts = 20;
      else if (margin === 'Medium') marginPts = 40;
      else if (margin === 'Large') marginPts = 80;

      for (const item of fileItems) {
        const source = await readInputBuffer(item || {});
        size += source.buffer.length;
        names.push(String(item?.input_filename || item?.filename || 'input.jpg'));
        
        let image;
        if (source.mimeType === 'image/png' || String(item?.input_filename).toLowerCase().endsWith('.png')) {
          image = await merged.embedPng(source.buffer);
        } else {
          image = await merged.embedJpg(source.buffer);
        }
        
        const dims = image.scale(1);
        
        // Simplified auto-fit for A4 dimensions
        let pw = 595.28;
        let ph = 841.89;
        
        if (pageSize === 'Letter') {
          pw = 612; ph = 792;
        } else if (pageSize === 'Legal') {
          pw = 612; ph = 1008;
        } else if (pageSize === 'Auto-fit') {
          pw = dims.width + marginPts * 2;
          ph = dims.height + marginPts * 2;
        }
        
        if (body.orientation === 'Landscape' && pw < ph) {
          const t = pw; pw = ph; ph = t;
        } else if (body.orientation === 'Auto') {
          if (dims.width > dims.height && pw < ph) {
            const t = pw; pw = ph; ph = t;
          }
        }
        
        const page = merged.addPage([pw, ph]);
        
        // Scale image to fit page minus margins
        const drawW = pw - marginPts * 2;
        const drawH = ph - marginPts * 2;
        const scale = Math.min(drawW / dims.width, drawH / dims.height);
        
        const scaledW = dims.width * scale;
        const scaledH = dims.height * scale;
        
        page.drawImage(image, {
          x: pw / 2 - scaledW / 2,
          y: ph / 2 - scaledH / 2,
          width: scaledW,
          height: scaledH,
        });
      }

      const outBuf = await merged.save({ useObjectStreams: true });
      const outName = String(body.output_filename || 'images-to-pdf.pdf');
      
      if (outBuf.toString('utf8', 0, 5) !== '%PDF-') {
        throw new Error("Output is not a valid PDF file");
      }
      
      return { outputBuffer: outBuf, outputName: outName, inputSize: size, inputNames: names };
    });

    const uploaded = await uploadOutput(storage, outputName, outputBuffer);

    await createExecution(db, {
      user_id: body.user_id || null,
      tool_slug: 'jpg-to-pdf',
      tool_name: 'JPG to PDF',
      category: 'PDF & Documents',
      status: 'completed',
      input_filename: inputNames.join(', ').slice(0, 512),
      input_size: inputSize,
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
        tool_slug: 'jpg-to-pdf',
        tool_name: 'JPG to PDF',
        category: 'PDF & Documents',
        status: 'error',
        input_filename: null,
        error_message: err.message,
        duration_ms: Date.now() - startedAt,
      });
    } catch {
    }
    return res.json({ success: false, error: err.message }, 500);
  }
}
