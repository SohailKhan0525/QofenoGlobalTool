import { Client, Databases, ID, Permission, Role, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { PDFDocument } from 'pdf-lib';

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
  const mimeType = match ? match[1] : 'application/octet-stream';
  return { buffer: Buffer.from(base64, 'base64'), mimeType };
}

async function readInputBuffer(body, storage) {
  const direct = decodeFileInput(body.file_base64 || body.input_base64 || body.data_base64 || body.file);
  if (direct) return direct;
  if (body.file_id && body.bucket_id) {
    const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '');
    const response = await fetch(`${endpoint}/storage/buckets/${body.bucket_id}/files/${body.file_id}/download`, {
      headers: { 'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID, 'X-Appwrite-Key': process.env.APPWRITE_API_KEY },
    });
    if (!response.ok) throw new Error(`Unable to download source file: ${response.status}`);
    return { buffer: Buffer.from(await response.arrayBuffer()), mimeType: 'application/octet-stream' };
  }
  throw new Error('file_base64 or file_id + bucket_id is required');
}

async function uploadOutput(storage, filename, buffer) {
  const file = await storage.createFile(
    process.env.BUCKET_OUTPUTS,
    ID.unique(),
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
  } catch (_) {}
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

  try {
    const source = await readInputBuffer(body, storage);
    const inputName = String(body.input_filename || body.filename || 'input');

    const { outputBuffer, outputName } = await (async () => {
      
      // Load source PDF
      let pdfDoc;
      try {
        pdfDoc = await PDFDocument.load(source.buffer, { ignoreEncryption: true });
      } catch (loadErr) {
        throw new Error('Invalid PDF file: ' + loadErr.message);
      }
      
      // Perform simple metadata tag or verify structure
      pdfDoc.setProducer('Qofeno Platform');
      pdfDoc.setCreator('Mohd Zaheer Uddin');
      
      const outBuf = Buffer.from(await pdfDoc.save({ useObjectStreams: true }));
      const outName = inputName.replace(/\.pdf$/i, '') + '_processed.pdf';
      
      if (!outBuf || outBuf.length === 0) throw new Error('Output is empty');
      if (outBuf.toString('utf8', 0, 5) !== '%PDF-') throw new Error('Invalid output format');
      
      return { outputBuffer: outBuf, outputName: outName };
    
    })();

    const uploaded = await uploadOutput(storage, outputName, outputBuffer);

    await createExecutionRecord(db, {
      user_id: body.user_id || null,
      tool_slug: 'pdf-n-up',
      tool_name: 'N-Up PDF',
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
    await createExecutionRecord(db, {
      user_id: body.user_id || null,
      tool_slug: 'pdf-n-up',
      tool_name: 'N-Up PDF',
      category: 'PDF & Documents',
      status: 'error',
      input_filename: body.input_filename || body.filename || null,
      error_message: err.message,
      duration_ms: Date.now() - startedAt,
    });
    return res.json({ success: false, error: err.message }, 500);
  }
};
