import { Client, Databases, ID, Permission, Role, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import sharp from 'sharp';

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
    const inputName = String(body.input_filename || body.filename || 'input');

    // Real background removal using color-distance thresholding with sharp.
    // Converts to raw RGBA, samples the background color (corner pixel),
    // then makes pixels within tolerance transparent.
    const threshold = Math.max(5, Math.min(100, parseInt(body.threshold) || 30));
    const bgSide = String(body.bg_side || 'top-left'); // top-left corner used for background sampling

    const { data: rawData, info } = await sharp(source.buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;

    // Sample background color from corner
    let sampleX = 0, sampleY = 0;
    if (bgSide === 'bottom-right') { sampleX = width - 1; sampleY = height - 1; }
    else if (bgSide === 'bottom-left') { sampleX = 0; sampleY = height - 1; }
    else if (bgSide === 'top-right') { sampleX = width - 1; sampleY = 0; }

    const sampleIdx = (sampleY * width + sampleX) * 4;
    const bgR = rawData[sampleIdx];
    const bgG = rawData[sampleIdx + 1];
    const bgB = rawData[sampleIdx + 2];

    log(`Background color sampled from ${bgSide}: rgb(${bgR},${bgG},${bgB}), threshold=${threshold}`);

    // Flood-fill from corner to make background pixels transparent
    const processed = Buffer.from(rawData);
    const visited = new Uint8Array(width * height);
    const queue = [];
    const startPixel = sampleY * width + sampleX;
    queue.push(startPixel);
    visited[startPixel] = 1;

    const threshSq = threshold * threshold * 3;

    const neighbors = [-1, 1, -width, width];

    while (queue.length > 0) {
      const pixIdx = queue.shift();
      const rawIdx = pixIdx * 4;
      const r = processed[rawIdx];
      const g = processed[rawIdx + 1];
      const b = processed[rawIdx + 2];

      const dr = r - bgR, dg = g - bgG, db = b - bgB;
      const distSq = dr * dr + dg * dg + db * db;

      if (distSq > threshSq) continue;

      // Make transparent
      processed[rawIdx + 3] = 0;

      for (const n of neighbors) {
        const np = pixIdx + n;
        if (np >= 0 && np < width * height && !visited[np]) {
          const nx = np % width;
          const px = pixIdx % width;
          if (Math.abs(nx - px) <= 1) {
            visited[np] = 1;
            queue.push(np);
          }
        }
      }
    }

    const outputBuffer = await sharp(processed, { raw: { width, height, channels: 4 } })
      .png()
      .toBuffer();

    const outputName = inputName.replace(/\.[^/.]+$/, '') + '-nobg.png';

    const uploaded = await uploadOutput(storage, outputName, outputBuffer);

    await createExecution(db, {
      user_id: body.user_id || null,
      tool_slug: 'image-bg-remover',
      tool_name: 'Image Background Remover',
      category: 'Image Tools',
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
        tool_slug: 'image-bg-remover',
        tool_name: 'Image Background Remover',
        category: 'Image Tools',
        status: 'error',
        input_filename: body.input_filename || body.filename || null,
        error_message: err.message,
        duration_ms: Date.now() - startedAt,
      });
    } catch {}
    return res.json({ success: false, error: err.message }, 500);
  }
};
