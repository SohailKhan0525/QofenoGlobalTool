import { Client, Databases, ID, Permission, Role, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import fs from 'fs';
import path from 'path';

ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

function parseBody(req) {
  if (req.bodyRaw && typeof req.bodyRaw === 'string') {
    try { return JSON.parse(req.bodyRaw); } catch { /* ignore */ }
  }
  if (req.body && typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { /* ignore */ }
  }
  if (typeof req.body === 'object' && req.body !== null) return req.body;
  return {};
}

async function downloadFile(bucketId, fileId, destPath) {
  const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '');
  const response = await fetch(`${endpoint}/storage/buckets/${bucketId}/files/${fileId}/download`, {
    headers: {
      'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID,
      'X-Appwrite-Key': process.env.APPWRITE_API_KEY,
    },
  });
  if (!response.ok) throw new Error(`Unable to download source file: ${response.status}`);
  
  if (response.body) {
    const fileStream = fs.createWriteStream(destPath);
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fileStream.write(Buffer.from(value));
    }
    fileStream.end();
    await new Promise((resolve) => fileStream.on('finish', resolve));
  } else {
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
  }
}

async function createExecution(db, payload) {
  return db.createDocument(process.env.DATABASE_ID, 'tool_executions', ID.unique(), {
    user_id: payload.user_id || null,
    tool_slug: payload.tool_slug,
    tool_name: payload.tool_name,
    category: payload.category,
    status: payload.status,
    input_filename: payload.input_filename || null,
    output_filename: payload.output_filename || null,
    download_url: payload.download_url || null,
    error_message: payload.error_message || null,
    duration_ms: payload.duration_ms || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

async function uploadOutput(storage, filePath, originalName) {
  const buffer = fs.readFileSync(filePath);
  const file = await storage.createFile(process.env.BUCKET_OUTPUTS, ID.unique(), InputFile.fromBuffer(buffer, originalName), [Permission.read(Role.any()), Permission.delete(Role.any())]);
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
  
  const tempDir = fs.mkdtempSync('/tmp/qofeno-audio-');
  let outputFilePath = null;

  try {
    const action = body.action || 'convert';
    const inputFiles = [];
    
    // Download input files
    if (body.files && Array.isArray(body.files)) {
      for (let i = 0; i < body.files.length; i++) {
        const dest = path.join(tempDir, `input_${i}_${body.files[i].filename}`);
        await downloadFile(body.files[i].bucket_id, body.files[i].file_id, dest);
        inputFiles.push({ path: dest, name: body.files[i].filename });
      }
    } else if (body.bucket_id && body.file_id) {
      const dest = path.join(tempDir, `input_0_${body.filename || 'audio.mp3'}`);
      await downloadFile(body.bucket_id, body.file_id, dest);
      inputFiles.push({ path: dest, name: body.filename || 'audio.mp3' });
    } else {
      throw new Error('No input files provided');
    }

    const primaryInput = inputFiles[0];
    const baseExt = path.extname(primaryInput.name) || '.mp3';
    const baseName = path.basename(primaryInput.name, baseExt);
    outputFilePath = path.join(tempDir, `output_${baseName}.mp3`);
    let outputFilename = `${baseName}_processed.mp3`;

    const cmd = ffmpeg();
    if (action !== 'merge') {
      cmd.input(primaryInput.path);
    }
    cmd.noVideo();

    let isMetadataOnly = false;

    // Apply specific logic
    switch (action) {
      case 'convert':
        const format = body.format || 'mp3';
        outputFilePath = path.join(tempDir, `output_${baseName}.${format}`);
        outputFilename = `${baseName}_converted.${format}`;
        if (format === 'mp3') cmd.audioCodec('libmp3lame');
        if (format === 'ogg') cmd.audioCodec('libvorbis');
        break;
      case 'trim':
        cmd.setStartTime(body.start_time || '00:00:00');
        if (body.end_time || body.duration) {
          cmd.setDuration(body.duration || body.end_time);
        }
        break;
      case 'merge':
        const listPath = path.join(tempDir, 'list.txt');
        const listContent = inputFiles.map(f => `file '${f.path}'`).join('\n');
        fs.writeFileSync(listPath, listContent);
        cmd.input(listPath).inputOptions(['-f', 'concat', '-safe', '0']).outputOptions('-c copy');
        break;
      case 'compress':
        cmd.audioFilters('acompressor=threshold=-20dB:ratio=4:attack=5:release=50');
        break;
      case 'volume-boost':
        const vol = body.volume || '2.0';
        cmd.audioFilters(`volume=${vol}`);
        break;
      case 'speed':
        const sp = parseFloat(body.speed || '1.5');
        cmd.audioFilters(`atempo=${sp}`);
        break;
      case 'pitch':
        // A simple way to change pitch in ffmpeg without rubberband is asetrate then atempo to correct speed
        const pitchRatio = parseFloat(body.pitch || '1.2');
        const sampleRate = 44100;
        const newRate = Math.round(sampleRate * pitchRatio);
        cmd.audioFilters(`asetrate=${newRate},atempo=${1/pitchRatio}`);
        break;
      case 'fade-in':
        const durIn = body.duration || '3';
        cmd.audioFilters(`afade=t=in:ss=0:d=${durIn}`);
        break;
      case 'fade-out':
        const startOut = body.start_time || '10';
        const durOut = body.duration || '3';
        cmd.audioFilters(`afade=t=out:st=${startOut}:d=${durOut}`);
        break;
      case 'silence-remove':
        cmd.audioFilters('silenceremove=stop_periods=-1:stop_duration=1:stop_threshold=-50dB');
        break;
      case 'reverse':
        cmd.audioFilters('areverse');
        break;
      case 'ringtone':
        cmd.setStartTime(body.start_time || '00:00:00');
        const duration = parseInt(body.duration || '30');
        cmd.setDuration(duration);
        cmd.audioFilters(`afade=t=out:st=${duration - 2}:d=2`);
        outputFilePath = path.join(tempDir, `output_${baseName}.m4r`);
        outputFilename = `${baseName}_ringtone.m4r`;
        break;
      case 'bass-boost':
        const gain = body.gain || '5';
        cmd.audioFilters(`bass=g=${gain}:f=110:w=0.6`);
        break;
      case 'noise-remove':
        // Using highpass and lowpass as a simple generic noise filter since afftdn isn't always available
        cmd.audioFilters('highpass=f=200,lowpass=f=3000');
        break;
      case 'metadata':
        isMetadataOnly = true;
        const probeData = await new Promise((res, rej) => {
          ffmpeg.ffprobe(primaryInput.path, (err, data) => err ? rej(err) : res(data));
        });
        fs.writeFileSync(path.join(tempDir, 'metadata.json'), JSON.stringify(probeData, null, 2));
        outputFilePath = path.join(tempDir, 'metadata.json');
        outputFilename = `${baseName}_metadata.json`;
        break;
      default:
        break;
    }

    if (!isMetadataOnly) {
      await new Promise((res, rej) => cmd.on('end', res).on('error', rej).save(outputFilePath));
    }

    const uploaded = await uploadOutput(storage, outputFilePath, outputFilename);

    await createExecution(db, {
      user_id: body.user_id || null,
      tool_slug: body.tool_slug || 'audio-manipulator',
      tool_name: body.tool_name || 'Audio Manipulator',
      category: 'Audio Tools',
      status: 'completed',
      input_filename: primaryInput.name,
      output_filename: outputFilename,
      download_url: uploaded.download_url,
      duration_ms: Date.now() - startedAt,
    });

    fs.rmSync(tempDir, { recursive: true, force: true });

    return res.json({
      success: true,
      output_filename: outputFilename,
      download_url: uploaded.download_url,
      file_id: uploaded.file.$id,
      duration_ms: Date.now() - startedAt,
    });
  } catch (err) {
    error(err.message);
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch { }
    try {
      await createExecution(db, {
        user_id: body.user_id || null,
        tool_slug: body.tool_slug || 'audio-manipulator',
        tool_name: body.tool_name || 'Audio Manipulator',
        category: 'Audio Tools',
        status: 'error',
        input_filename: body.filename || null,
        error_message: err.message,
        duration_ms: Date.now() - startedAt,
      });
    } catch { }
    return res.json({ success: false, error: err.message }, 500);
  }
}
