import { Client, Databases, Query, ID, Permission, Role, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import pdfParse from 'pdf-parse';
import ExcelJS from 'exceljs';

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

  try {
    const source = await readInputBuffer(body);
    const inputName = String(body.input_filename || body.filename || 'input.pdf');

    const { outputBuffer, outputName } = await processWithRetry(async () => {
      // Extract text from PDF
      const pdfData = await pdfParse(source.buffer);
      const rawText = pdfData.text || '';

      if (!rawText.trim()) {
        throw new Error('No text content found in PDF. The PDF may contain only images.');
      }

      // Build real Excel workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Qofeno';
      workbook.created = new Date();
      
      const worksheet = workbook.addWorksheet('Extracted Content');
      
      // Style the header row
      worksheet.columns = [
        { header: 'Line', key: 'line', width: 8 },
        { header: 'Content', key: 'content', width: 100 },
      ];
      
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF7C3AED' },
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      
      // Add text lines as rows
      const lines = rawText.split('\n').filter(l => l.trim());
      lines.forEach((line, i) => {
        worksheet.addRow({ line: i + 1, content: line.trim() });
      });

      const outBuf = await workbook.xlsx.writeBuffer();
      const outName = inputName.replace(/\.pdf$/i, '') + '.xlsx';

      // Validate: xlsx is a zip starting with PK
      if (outBuf[0] !== 0x50 || outBuf[1] !== 0x4B) {
        throw new Error('Output .xlsx is corrupted');
      }
      if (!outBuf || outBuf.byteLength === 0) {
        throw new Error('Output file is empty — processing failed');
      }

      log(`Converted PDF to XLSX: ${outName} (${outBuf.byteLength} bytes), ${lines.length} rows`);
      return { outputBuffer: Buffer.from(outBuf), outputName: outName };
    });

    const uploaded = await uploadOutput(storage, outputName, outputBuffer);

    await createExecutionRecord(db, {
      user_id: body.user_id || null,
      tool_slug: 'pdf-to-excel',
      tool_name: 'PDF to Excel',
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
      tool_slug: 'pdf-to-excel',
      tool_name: 'PDF to Excel',
      category: 'PDF & Documents',
      status: 'error',
      input_filename: body.input_filename || body.filename || null,
      error_message: err.message,
      duration_ms: Date.now() - startedAt,
    });
    return res.json({ success: false, error: err.message }, 500);
  }
};