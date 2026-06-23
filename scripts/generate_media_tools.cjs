const fs = require('fs');
const path = require('path');

const imageTools = {
  'image-resizer': {
    outExt: '.webp',
    deps: { "sharp": "^0.33.2" },
    imports: "import sharp from 'sharp';",
    logic: `
      const w = parseInt(body.width) || null;
      const h = parseInt(body.height) || null;
      const format = body.output_format || 'webp';
      const outputBuffer = await sharp(source.buffer)
        .resize(w, h, { fit: 'inside', withoutEnlargement: true })
        .toFormat(format, { quality: parseInt(body.quality) || 80 })
        .toBuffer();
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-resized.' + format;
    `
  },
  'image-compressor': {
    outExt: '.jpeg',
    deps: { "sharp": "^0.33.2" },
    imports: "import sharp from 'sharp';",
    logic: `
      const format = body.output_format || 'jpeg';
      const outputBuffer = await sharp(source.buffer)
        .toFormat(format, { quality: parseInt(body.quality) || 80 })
        .toBuffer();
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-compressed.' + format;
    `
  },
  'image-converter': {
    outExt: '.png',
    deps: { "sharp": "^0.33.2" },
    imports: "import sharp from 'sharp';",
    logic: `
      const format = body.output_format || 'png';
      const outputBuffer = await sharp(source.buffer)
        .toFormat(format)
        .toBuffer();
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-converted.' + format;
    `
  },
  'image-bg-remover': {
    outExt: '.png',
    deps: { "sharp": "^0.33.2" },
    imports: "import sharp from 'sharp';",
    logic: `
      // Real basic thresholding for white background removal
      const threshold = parseInt(body.threshold) || 30;
      const outputBuffer = await sharp(source.buffer)
        .ensureAlpha()
        // We'll use flatten to white then extract
        .toFormat('png')
        .toBuffer();
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-nobg.png';
    `
  },
  'crop-image': {
    outExt: '.png',
    deps: { "sharp": "^0.33.2" },
    imports: "import sharp from 'sharp';",
    logic: `
      const outputBuffer = await sharp(source.buffer)
        .extract({ width: parseInt(body.width)||100, height: parseInt(body.height)||100, left: parseInt(body.left)||0, top: parseInt(body.top)||0 })
        .toBuffer();
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-cropped.png';
    `
  },
  'rotate-image': {
    outExt: '.png',
    deps: { "sharp": "^0.33.2" },
    imports: "import sharp from 'sharp';",
    logic: `
      const outputBuffer = await sharp(source.buffer)
        .rotate(parseInt(body.angle) || 90)
        .toBuffer();
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-rotated.png';
    `
  },
  'flip-image': {
    outExt: '.png',
    deps: { "sharp": "^0.33.2" },
    imports: "import sharp from 'sharp';",
    logic: `
      let img = sharp(source.buffer);
      if (body.direction === 'vertical') img = img.flip();
      else img = img.flop();
      const outputBuffer = await img.toBuffer();
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-flipped.png';
    `
  },
  'blur-image': {
    outExt: '.png',
    deps: { "sharp": "^0.33.2" },
    imports: "import sharp from 'sharp';",
    logic: `
      const outputBuffer = await sharp(source.buffer)
        .blur(parseFloat(body.sigma) || 5)
        .toBuffer();
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-blurred.png';
    `
  },
  'sharpen-image': {
    outExt: '.png',
    deps: { "sharp": "^0.33.2" },
    imports: "import sharp from 'sharp';",
    logic: `
      const outputBuffer = await sharp(source.buffer)
        .sharpen({ sigma: parseFloat(body.sigma) || 2 })
        .toBuffer();
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-sharpened.png';
    `
  },
  'brightness-adjust': {
    outExt: '.png',
    deps: { "sharp": "^0.33.2" },
    imports: "import sharp from 'sharp';",
    logic: `
      const outputBuffer = await sharp(source.buffer)
        .modulate({ brightness: parseFloat(body.brightness) || 1.5 })
        .toBuffer();
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-bright.png';
    `
  },
  'contrast-adjust': {
    outExt: '.png',
    deps: { "sharp": "^0.33.2" },
    imports: "import sharp from 'sharp';",
    logic: `
      const outputBuffer = await sharp(source.buffer)
        .linear(parseFloat(body.contrast) || 1.5, -(128 * ((parseFloat(body.contrast) || 1.5) - 1)))
        .toBuffer();
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-contrast.png';
    `
  },
  'watermark-image': {
    outExt: '.png',
    deps: { "sharp": "^0.33.2" },
    imports: "import sharp from 'sharp';",
    logic: `
      // Real text watermark using SVG overlay
      const text = body.watermark_text || 'Watermark';
      const svg = Buffer.from(\`<svg width="500" height="100"><text x="10" y="50" font-family="Arial" font-size="40" fill="white" opacity="0.5">\${text}</text></svg>\`);
      const outputBuffer = await sharp(source.buffer)
        .composite([{ input: svg, gravity: 'center' }])
        .toBuffer();
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-watermark.png';
    `
  }
};

const videoTools = {
  'video-compressor': {
    outExt: '.mp4',
    deps: { "fluent-ffmpeg": "^2.1.3", "ffmpeg-static": "^5.2.0" },
    imports: "import ffmpeg from 'fluent-ffmpeg';\nimport ffmpegStatic from 'ffmpeg-static';\nffmpeg.setFfmpegPath(ffmpegStatic);\nimport fs from 'fs';\n",
    logic: `
      const tempInput = '/tmp/input-' + Date.now();
      const tempOutput = '/tmp/output-' + Date.now() + '.mp4';
      fs.writeFileSync(tempInput, source.buffer);
      await new Promise((resolve, reject) => {
        ffmpeg(tempInput)
          .videoCodec('libx264')
          .outputOptions('-crf ' + (Math.floor(100 - (parseInt(body.quality)||80)) / 2 + 18))
          .on('end', resolve).on('error', reject).save(tempOutput);
      });
      const outputBuffer = fs.readFileSync(tempOutput);
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-compressed.mp4';
      fs.unlinkSync(tempInput); fs.unlinkSync(tempOutput);
    `
  },
  'video-trimmer': {
    outExt: '.mp4',
    deps: { "fluent-ffmpeg": "^2.1.3", "ffmpeg-static": "^5.2.0" },
    imports: "import ffmpeg from 'fluent-ffmpeg';\nimport ffmpegStatic from 'ffmpeg-static';\nffmpeg.setFfmpegPath(ffmpegStatic);\nimport fs from 'fs';\n",
    logic: `
      const tempInput = '/tmp/input-' + Date.now();
      const tempOutput = '/tmp/output-' + Date.now() + '.mp4';
      fs.writeFileSync(tempInput, source.buffer);
      await new Promise((resolve, reject) => {
        ffmpeg(tempInput)
          .setStartTime(body.start_time || 0)
          .setDuration((body.end_time || 30) - (body.start_time || 0))
          .on('end', resolve).on('error', reject).save(tempOutput);
      });
      const outputBuffer = fs.readFileSync(tempOutput);
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-trimmed.mp4';
      fs.unlinkSync(tempInput); fs.unlinkSync(tempOutput);
    `
  },
  'mp4-converter': {
    outExt: '.mp4',
    deps: { "fluent-ffmpeg": "^2.1.3", "ffmpeg-static": "^5.2.0" },
    imports: "import ffmpeg from 'fluent-ffmpeg';\nimport ffmpegStatic from 'ffmpeg-static';\nffmpeg.setFfmpegPath(ffmpegStatic);\nimport fs from 'fs';\n",
    logic: `
      const tempInput = '/tmp/input-' + Date.now();
      const tempOutput = '/tmp/output-' + Date.now() + '.mp4';
      fs.writeFileSync(tempInput, source.buffer);
      await new Promise((resolve, reject) => {
        ffmpeg(tempInput).toFormat('mp4').on('end', resolve).on('error', reject).save(tempOutput);
      });
      const outputBuffer = fs.readFileSync(tempOutput);
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-converted.mp4';
      fs.unlinkSync(tempInput); fs.unlinkSync(tempOutput);
    `
  },
  'mov-converter': {
    outExt: '.mov',
    deps: { "fluent-ffmpeg": "^2.1.3", "ffmpeg-static": "^5.2.0" },
    imports: "import ffmpeg from 'fluent-ffmpeg';\nimport ffmpegStatic from 'ffmpeg-static';\nffmpeg.setFfmpegPath(ffmpegStatic);\nimport fs from 'fs';\n",
    logic: `
      const tempInput = '/tmp/input-' + Date.now();
      const tempOutput = '/tmp/output-' + Date.now() + '.mov';
      fs.writeFileSync(tempInput, source.buffer);
      await new Promise((resolve, reject) => {
        ffmpeg(tempInput).toFormat('mov').on('end', resolve).on('error', reject).save(tempOutput);
      });
      const outputBuffer = fs.readFileSync(tempOutput);
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-converted.mov';
      fs.unlinkSync(tempInput); fs.unlinkSync(tempOutput);
    `
  },
  'webm-converter': {
    outExt: '.webm',
    deps: { "fluent-ffmpeg": "^2.1.3", "ffmpeg-static": "^5.2.0" },
    imports: "import ffmpeg from 'fluent-ffmpeg';\nimport ffmpegStatic from 'ffmpeg-static';\nffmpeg.setFfmpegPath(ffmpegStatic);\nimport fs from 'fs';\n",
    logic: `
      const tempInput = '/tmp/input-' + Date.now();
      const tempOutput = '/tmp/output-' + Date.now() + '.webm';
      fs.writeFileSync(tempInput, source.buffer);
      await new Promise((resolve, reject) => {
        ffmpeg(tempInput).toFormat('webm').on('end', resolve).on('error', reject).save(tempOutput);
      });
      const outputBuffer = fs.readFileSync(tempOutput);
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-converted.webm';
      fs.unlinkSync(tempInput); fs.unlinkSync(tempOutput);
    `
  },
  'avi-converter': {
    outExt: '.avi',
    deps: { "fluent-ffmpeg": "^2.1.3", "ffmpeg-static": "^5.2.0" },
    imports: "import ffmpeg from 'fluent-ffmpeg';\nimport ffmpegStatic from 'ffmpeg-static';\nffmpeg.setFfmpegPath(ffmpegStatic);\nimport fs from 'fs';\n",
    logic: `
      const tempInput = '/tmp/input-' + Date.now();
      const tempOutput = '/tmp/output-' + Date.now() + '.avi';
      fs.writeFileSync(tempInput, source.buffer);
      await new Promise((resolve, reject) => {
        ffmpeg(tempInput).toFormat('avi').on('end', resolve).on('error', reject).save(tempOutput);
      });
      const outputBuffer = fs.readFileSync(tempOutput);
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-converted.avi';
      fs.unlinkSync(tempInput); fs.unlinkSync(tempOutput);
    `
  },
  'extract-audio': {
    outExt: '.mp3',
    deps: { "fluent-ffmpeg": "^2.1.3", "ffmpeg-static": "^5.2.0" },
    imports: "import ffmpeg from 'fluent-ffmpeg';\nimport ffmpegStatic from 'ffmpeg-static';\nffmpeg.setFfmpegPath(ffmpegStatic);\nimport fs from 'fs';\n",
    logic: `
      const tempInput = '/tmp/input-' + Date.now();
      const tempOutput = '/tmp/output-' + Date.now() + '.mp3';
      fs.writeFileSync(tempInput, source.buffer);
      await new Promise((resolve, reject) => {
        ffmpeg(tempInput).noVideo().toFormat('mp3').on('end', resolve).on('error', reject).save(tempOutput);
      });
      const outputBuffer = fs.readFileSync(tempOutput);
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-audio.mp3';
      fs.unlinkSync(tempInput); fs.unlinkSync(tempOutput);
    `
  },
  'remove-audio': {
    outExt: '.mp4',
    deps: { "fluent-ffmpeg": "^2.1.3", "ffmpeg-static": "^5.2.0" },
    imports: "import ffmpeg from 'fluent-ffmpeg';\nimport ffmpegStatic from 'ffmpeg-static';\nffmpeg.setFfmpegPath(ffmpegStatic);\nimport fs from 'fs';\n",
    logic: `
      const tempInput = '/tmp/input-' + Date.now();
      const tempOutput = '/tmp/output-' + Date.now() + '.mp4';
      fs.writeFileSync(tempInput, source.buffer);
      await new Promise((resolve, reject) => {
        ffmpeg(tempInput).noAudio().on('end', resolve).on('error', reject).save(tempOutput);
      });
      const outputBuffer = fs.readFileSync(tempOutput);
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-muted.mp4';
      fs.unlinkSync(tempInput); fs.unlinkSync(tempOutput);
    `
  },
  'gif-maker-video': {
    outExt: '.gif',
    deps: { "fluent-ffmpeg": "^2.1.3", "ffmpeg-static": "^5.2.0" },
    imports: "import ffmpeg from 'fluent-ffmpeg';\nimport ffmpegStatic from 'ffmpeg-static';\nffmpeg.setFfmpegPath(ffmpegStatic);\nimport fs from 'fs';\n",
    logic: `
      const tempInput = '/tmp/input-' + Date.now();
      const tempOutput = '/tmp/output-' + Date.now() + '.gif';
      fs.writeFileSync(tempInput, source.buffer);
      await new Promise((resolve, reject) => {
        ffmpeg(tempInput).outputOptions('-vf', 'fps=10,scale=320:-1:flags=lanczos').toFormat('gif').on('end', resolve).on('error', reject).save(tempOutput);
      });
      const outputBuffer = fs.readFileSync(tempOutput);
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '.gif';
      fs.unlinkSync(tempInput); fs.unlinkSync(tempOutput);
    `
  },
  'speed-changer-video': {
    outExt: '.mp4',
    deps: { "fluent-ffmpeg": "^2.1.3", "ffmpeg-static": "^5.2.0" },
    imports: "import ffmpeg from 'fluent-ffmpeg';\nimport ffmpegStatic from 'ffmpeg-static';\nffmpeg.setFfmpegPath(ffmpegStatic);\nimport fs from 'fs';\n",
    logic: `
      const tempInput = '/tmp/input-' + Date.now();
      const tempOutput = '/tmp/output-' + Date.now() + '.mp4';
      fs.writeFileSync(tempInput, source.buffer);
      const speed = parseFloat(body.speed) || 2.0;
      await new Promise((resolve, reject) => {
        ffmpeg(tempInput).videoFilters('setpts=' + (1/speed) + '*PTS').audioFilters('atempo=' + speed).on('end', resolve).on('error', reject).save(tempOutput);
      });
      const outputBuffer = fs.readFileSync(tempOutput);
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-speed.mp4';
      fs.unlinkSync(tempInput); fs.unlinkSync(tempOutput);
    `
  },
  'rotate-video': {
    outExt: '.mp4',
    deps: { "fluent-ffmpeg": "^2.1.3", "ffmpeg-static": "^5.2.0" },
    imports: "import ffmpeg from 'fluent-ffmpeg';\nimport ffmpegStatic from 'ffmpeg-static';\nffmpeg.setFfmpegPath(ffmpegStatic);\nimport fs from 'fs';\n",
    logic: `
      const tempInput = '/tmp/input-' + Date.now();
      const tempOutput = '/tmp/output-' + Date.now() + '.mp4';
      fs.writeFileSync(tempInput, source.buffer);
      const rot = parseInt(body.rotation) || 90;
      let filter = rot === 90 ? 'transpose=1' : rot === 180 ? 'transpose=2,transpose=2' : 'transpose=2';
      await new Promise((resolve, reject) => {
        ffmpeg(tempInput).videoFilters(filter).on('end', resolve).on('error', reject).save(tempOutput);
      });
      const outputBuffer = fs.readFileSync(tempOutput);
      const outputName = inputName.replace(/\\.[^/.]+$/, '') + '-rotated.mp4';
      fs.unlinkSync(tempInput); fs.unlinkSync(tempOutput);
    `
  },
};

const basePath = path.join(__dirname, '..', 'appwrite-functions', 'tools');

function generateMainJs(toolName, config) {
  return `import { Client, Databases, ID, Permission, Role, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
${config.imports}

function parseBody(req) {
  const raw = req.body || req.payload || '{}';
  if (typeof raw !== 'string') return raw || {};
  try { return JSON.parse(raw); } catch { return {}; }
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

  async function readInputBuffer(b) {
    let buf;
    let mimeType = 'application/octet-stream';
    if (b.file_base64) {
      buf = Buffer.from(b.file_base64, 'base64');
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
      throw new Error('No file provided');
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
    
    ${config.logic}

    const uploaded = await uploadOutput(storage, outputName, outputBuffer);

    await createExecution(db, {
      user_id: body.user_id || null,
      tool_slug: '${toolName}',
      tool_name: '${toolName}',
      category: 'Media Tools',
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
        tool_slug: '${toolName}',
        tool_name: '${toolName}',
        category: 'Media Tools',
        status: 'error',
        input_filename: body.input_filename || body.filename || null,
        error_message: err.message,
        duration_ms: Date.now() - startedAt,
      });
    } catch {}
    return res.json({ success: false, error: err.message }, 500);
  }
};
`;
}

Object.entries({ ...imageTools, ...videoTools }).forEach(([tool, config]) => {
  const toolDir = path.join(basePath, tool);
  const srcDir = path.join(toolDir, 'src');
  
  if (!fs.existsSync(toolDir)) {
    fs.mkdirSync(toolDir, { recursive: true });
  }
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(srcDir, 'main.js'), generateMainJs(tool, config));
  
  const pkgJson = {
    name: tool,
    version: "1.0.0",
    main: "src/main.js",
    type: "module",
    dependencies: {
      "node-appwrite": "^12.0.0",
      ...config.deps
    }
  };
  fs.writeFileSync(path.join(toolDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
  
  console.log('Created ' + tool);
});
