import { Client, Databases, ID, Permission, Role, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';

ffmpeg.setFfmpegPath(ffmpegStatic);

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

export default async ({ req, res, log, error }) => {
  const body = parseBody(req);
  const client = new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
  const storage = new Storage(client);
  const db = new Databases(client);
  const startedAt = Date.now();

  async function createExecution(dbClient, data) {
    try {
      await dbClient.createDocument(process.env.DATABASE_ID, 'tool_executions', ID.unique(), data, [Permission.read(Role.any())]);
    } catch (e) {
      error('Failed to create execution record: ' + e.message);
    }
  }

  function decodeBase64Input(value) {
    if (!value || typeof value !== 'string') return value;
    // Strip data URL prefix: "data:image/jpeg;base64,/9j/..." => "/9j/..."
    const match = value.match(/^data:[^;]+;base64,(.+)$/i);
    return match ? match[1] : value;
  }

  async function readInputBuffer(b) {
    let buf;
    let mimeType = 'application/octet-stream';
    if (b.file_base64) {
      const raw = decodeBase64Input(b.file_base64);
      buf = Buffer.from(raw, 'base64');
      mimeType = b.mime_type || mimeType;
    } else if (b.file_url) {
      const response = await fetch(b.file_url);
      if (!response.ok) throw new Error('Failed to fetch file from URL');
      const arrayBuffer = await response.arrayBuffer();
      buf = Buffer.from(arrayBuffer);
      mimeType = response.headers.get('content-type') || mimeType;
    } else if (b.file_id) {
      const arrayBuffer = await storage.getFileDownload(process.env.BUCKET_INPUTS, b.file_id);
      buf = Buffer.from(arrayBuffer);
    } else {
      throw new Error('No file provided. Send file_base64, file_url, or file_id.');
    }
    return { buffer: buf, mimeType };
  }

  async function uploadOutput(storageClient, filename, buffer) {
    const fileForUpload = InputFile.fromBuffer(buffer, filename);
    const uploaded = await storageClient.createFile(process.env.BUCKET_OUTPUTS, ID.unique(), fileForUpload, [Permission.read(Role.any())]);
    const download_url = process.env.APPWRITE_ENDPOINT + '/storage/buckets/' + process.env.BUCKET_OUTPUTS + '/files/' + uploaded.$id + '/download?project=' + process.env.APPWRITE_PROJECT_ID;
    return { file: uploaded, download_url };
  }

  try {
    const source = await readInputBuffer(body);
    const inputName = String(body.input_filename || body.filename || 'input.audio');
    
    // Save to temp
    const tempInput = '/tmp/input-' + Date.now();
    const tempOutput = '/tmp/output-' + Date.now() + '.mp3';
    fs.writeFileSync(tempInput, source.buffer);

    await new Promise((resolve, reject) => {
      let command = ffmpeg(tempInput);
      command.audioFilters('afade=t=in:ss=0:d=3');
      command.on('end', () => resolve())
             .on('error', (err) => reject(new Error('FFmpeg Error: ' + err.message)))
             .save(tempOutput);
    });

    const outputBuffer = fs.readFileSync(tempOutput);
    const outputName = inputName.replace(/\.[^/.]+$/, '') + '-output.mp3';
    const uploaded = await uploadOutput(storage, outputName, outputBuffer);

    // cleanup
    try { fs.unlinkSync(tempInput); fs.unlinkSync(tempOutput); } catch(e){}

    await createExecution(db, {
      user_id: body.user_id || null,
      tool_slug: 'fade-in',
      tool_name: 'fade-in',
      category: 'Audio Tools',
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
        tool_slug: 'fade-in',
        tool_name: 'fade-in',
        category: 'Audio Tools',
        status: 'error',
        input_filename: body.input_filename || body.filename || null,
        error_message: err.message,
        duration_ms: Date.now() - startedAt,
      });
    } catch {}
    return res.json({ success: false, error: err.message }, 500);
  }
};
