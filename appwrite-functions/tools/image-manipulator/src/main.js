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

export default async ({ req, res, error }) => {
  const body = parseBody(req);
  const client = new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
  const storage = new Storage(client);
  const db = new Databases(client);
  const startedAt = Date.now();

  try {
    const source = await readInputBuffer(body);
    const inputName = String(body.input_filename || body.filename || 'input-image');
    let transformer = sharp(source.buffer);
    
    // Fallback format
    let outputFormat = 'png';
    const originalExtMatch = inputName.match(/\.([^.]+)$/);
    if (originalExtMatch) {
      outputFormat = originalExtMatch[1].toLowerCase();
      if (outputFormat === 'jpg') outputFormat = 'jpeg';
    }

    const action = body.action || 'convert';
    
    // Apply operations
    if (action === 'crop') {
      const { left = 0, top = 0, width, height } = body;
      if (width && height) {
        transformer = transformer.extract({ left: Number(left), top: Number(top), width: Number(width), height: Number(height) });
      }
    } else if (action === 'resize') {
      const width = body.width ? Number(body.width) : null;
      const height = body.height ? Number(body.height) : null;
      if (width || height) {
        transformer = transformer.resize(width, height, { fit: body.fit || 'cover', withoutEnlargement: body.without_enlargement !== false });
      }
    } else if (action === 'compress') {
      const q = Number(body.quality || 80);
      if (outputFormat === 'jpeg' || outputFormat === 'jpg') transformer = transformer.jpeg({ quality: q });
      else if (outputFormat === 'webp') transformer = transformer.webp({ quality: q });
      else if (outputFormat === 'avif') transformer = transformer.avif({ quality: q });
      else transformer = transformer.png({ compressionLevel: 9 });
    } else if (action === 'convert') {
      outputFormat = String(body.output_format || body.format || 'png').toLowerCase();
      if (outputFormat === 'jpg') outputFormat = 'jpeg';
    } else if (action === 'rotate') {
      transformer = transformer.rotate(Number(body.angle || 90));
    } else if (action === 'flip') {
      if (body.axis === 'y') transformer = transformer.flip();
      else transformer = transformer.flop();
    } else if (action === 'blur') {
      transformer = transformer.blur(Number(body.sigma || 5));
    } else if (action === 'sharpen') {
      transformer = transformer.sharpen({ sigma: Number(body.sigma || 1), m1: Number(body.m1 || 1), m2: Number(body.m2 || 2) });
    } else if (action === 'brightness') {
      transformer = transformer.modulate({ brightness: Number(body.brightness || 1.5) });
    } else if (action === 'contrast') {
      transformer = transformer.modulate({ brightness: 1, lightness: Number(body.contrast || 1.2) });
    } else if (action === 'watermark') {
      const watermarkText = String(body.text || 'Watermark');
      // A simple SVG text layer for the watermark
      const svgText = `
        <svg width="1000" height="1000">
          <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="80" fill="rgba(255,255,255,0.5)">
            ${watermarkText}
          </text>
        </svg>
      `;
      transformer = transformer.composite([{ input: Buffer.from(svgText), gravity: 'center' }]);
    }

    // Finalize output
    let outputBuffer;
    let outputName = inputName.replace(/\.[^.]+$/, '');

    if (outputFormat === 'jpeg' || outputFormat === 'jpg') {
      outputBuffer = await transformer.jpeg({ quality: Number(body.quality || 82) }).toBuffer();
      outputName += '.jpg';
    } else if (outputFormat === 'webp') {
      outputBuffer = await transformer.webp({ quality: Number(body.quality || 80) }).toBuffer();
      outputName += '.webp';
    } else if (outputFormat === 'avif') {
      outputBuffer = await transformer.avif({ quality: Number(body.quality || 50) }).toBuffer();
      outputName += '.avif';
    } else {
      outputBuffer = await transformer.png({ compressionLevel: Number(body.compression_level || 9) }).toBuffer();
      outputName += '.png';
    }

    const uploaded = await uploadOutput(storage, outputName, outputBuffer);

    await createExecution(db, {
      user_id: body.user_id || null,
      tool_slug: body.tool_slug || 'image-manipulator',
      tool_name: body.tool_name || 'Image Manipulator',
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
        tool_slug: body.tool_slug || 'image-manipulator',
        tool_name: body.tool_name || 'Image Manipulator',
        category: 'Image Tools',
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
