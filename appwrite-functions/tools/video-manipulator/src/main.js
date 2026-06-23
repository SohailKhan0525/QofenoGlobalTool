import { Client, Databases, ID, Permission, Role, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

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
    // For Node 18+ fetch API where body is a web stream
    const fileStream = fs.createWriteStream(destPath);
    // Converting web stream to node readable
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fileStream.write(Buffer.from(value));
    }
    fileStream.end();
    await new Promise((resolve) => fileStream.on('finish', resolve));
  } else {
    // Fallback if arrayBuffer
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
  
  const tempDir = fs.mkdtempSync('/tmp/qofeno-video-');
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
      const dest = path.join(tempDir, `input_0_${body.filename || 'video.mp4'}`);
      await downloadFile(body.bucket_id, body.file_id, dest);
      inputFiles.push({ path: dest, name: body.filename || 'video.mp4' });
    } else {
      throw new Error('No input files provided');
    }

    const primaryInput = inputFiles[0];
    const baseExt = path.extname(primaryInput.name) || '.mp4';
    const baseName = path.basename(primaryInput.name, baseExt);
    outputFilePath = path.join(tempDir, `output_${baseName}.mp4`);
    let outputFilename = `${baseName}_processed.mp4`;

    const cmd = ffmpeg();
    if (action !== 'merge' && action !== 'watermark') {
      cmd.input(primaryInput.path);
    }

    let isMetadataOnly = false;

    // Apply specific logic
    switch (action) {
      case 'trim':
        cmd.setStartTime(body.start_time || '00:00:00');
        if (body.end_time || body.duration) {
          cmd.setDuration(body.duration || body.end_time);
        }
        break;
      case 'crop':
        cmd.videoFilters(`crop=${body.width || 'iw/2'}:${body.height || 'ih/2'}:${body.x || 0}:${body.y || 0}`);
        break;
      case 'compress':
        cmd.videoCodec('libx264').addOption('-crf', body.crf || '28');
        break;
      case 'convert':
        outputFilePath = path.join(tempDir, `output_${baseName}.${body.format || 'mp4'}`);
        outputFilename = `${baseName}_converted.${body.format || 'mp4'}`;
        break;
      case 'merge':
        // Merge requires all inputs to be the same codec/resolution for simple concat, or re-encode
        const listPath = path.join(tempDir, 'list.txt');
        const listContent = inputFiles.map(f => `file '${f.path}'`).join('\n');
        fs.writeFileSync(listPath, listContent);
        cmd.input(listPath).inputOptions(['-f', 'concat', '-safe', '0']).outputOptions('-c copy');
        break;
      case 'rotate':
        // 1=90CW, 2=90CCW
        let transpose = '1';
        if (body.angle === '90') transpose = '1';
        else if (body.angle === '-90' || body.angle === '270') transpose = '2';
        else if (body.angle === '180') transpose = '1,transpose=1';
        cmd.videoFilters(`transpose=${transpose}`);
        break;
      case 'flip':
        if (body.axis === 'v') cmd.videoFilters('vflip');
        else cmd.videoFilters('hflip');
        break;
      case 'extract-audio':
        cmd.noVideo().audioCodec('libmp3lame');
        outputFilePath = path.join(tempDir, `output_${baseName}.mp3`);
        outputFilename = `${baseName}_audio.mp3`;
        break;
      case 'remove-audio':
        cmd.noAudio();
        break;
      case 'speed':
        const sp = parseFloat(body.speed || '2.0');
        const vsp = 1.0 / sp;
        cmd.videoFilters(`setpts=${vsp}*PTS`);
        if (sp >= 0.5 && sp <= 2.0) {
          cmd.audioFilters(`atempo=${sp}`);
        } else {
          cmd.noAudio(); // ATEMPO only supports 0.5 to 2.0 in a single filter
        }
        break;
      case 'reverse':
        cmd.videoFilters('reverse').audioFilters('areverse');
        break;
      case 'loop':
        cmd.addOption('-stream_loop', parseInt(body.loops || '1'));
        break;
      case 'gif':
        cmd.videoFilters('fps=10,scale=320:-1:flags=lanczos');
        outputFilePath = path.join(tempDir, `output_${baseName}.gif`);
        outputFilename = `${baseName}.gif`;
        break;
      case 'thumbnail':
        const time = body.timestamp || '00:00:01';
        cmd.seekInput(time).frames(1);
        outputFilePath = path.join(tempDir, `output_${baseName}.jpg`);
        outputFilename = `${baseName}_thumb.jpg`;
        break;
      case 'resolution':
        cmd.videoFilters(`scale=${body.width || '-1'}:${body.height || '-1'}`);
        break;
      case 'fps':
        cmd.fps(parseInt(body.fps || '30'));
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
      case 'watermark':
        if (inputFiles.length < 2) throw new Error('Watermark requires a second image file');
        cmd.input(primaryInput.path).input(inputFiles[1].path);
        cmd.complexFilter(`overlay=${body.x || '10'}:${body.y || '10'}`);
        break;
      case 'subtitle':
        if (inputFiles.length < 2) throw new Error('Subtitle requires a second SRT file');
        // Simple stream mapping to soft-subs
        cmd.input(primaryInput.path).input(inputFiles[1].path).outputOptions(['-c copy', '-c:s mov_text']);
        break;
      case 'stabilization':
        cmd.videoFilters('deshake');
        break;
      case 'aspect-ratio':
        cmd.videoFilters(`setdar=${body.ratio || '16/9'}`);
        break;
      case 'audio-sync':
        const delay = parseFloat(body.delay || '0');
        // Shift audio
        cmd.outputOptions([`-itsoffset ${delay}`, '-i', primaryInput.path, '-map 0:v', '-map 1:a', '-c copy']);
        break;
      case 'frame-extract':
        cmd.outputOptions(['-r 1']); // 1 fps
        outputFilePath = path.join(tempDir, `output_%03d.jpg`);
        outputFilename = `${baseName}_frames.zip`; // Not fully zipping here for brevity but standard logic extracts
        // For simplicity, we just extract one frame or a few to a single file if requested,
        // or a zip. Let's just output a single zip by writing a custom command or let ffmpeg output %03d.jpg and then zip them.
        break;
      default:
        break;
    }

    if (!isMetadataOnly) {
      if (action === 'frame-extract') {
        await new Promise((res, rej) => cmd.on('end', res).on('error', rej).save(path.join(tempDir, `frame_%03d.jpg`)));
        // Zip the frames
        const { execSync } = require('child_process');
        execSync(`cd ${tempDir} && zip frames.zip frame_*.jpg`);
        outputFilePath = path.join(tempDir, 'frames.zip');
        outputFilename = `${baseName}_frames.zip`;
      } else {
        await new Promise((res, rej) => cmd.on('end', res).on('error', rej).save(outputFilePath));
      }
    }

    const uploaded = await uploadOutput(storage, outputFilePath, outputFilename);

    await createExecution(db, {
      user_id: body.user_id || null,
      tool_slug: body.tool_slug || 'video-manipulator',
      tool_name: body.tool_name || 'Video Manipulator',
      category: 'Video Tools',
      status: 'completed',
      input_filename: primaryInput.name,
      output_filename: outputFilename,
      download_url: uploaded.download_url,
      duration_ms: Date.now() - startedAt,
    });

    // Cleanup
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
        tool_slug: body.tool_slug || 'video-manipulator',
        tool_name: body.tool_name || 'Video Manipulator',
        category: 'Video Tools',
        status: 'error',
        input_filename: body.filename || null,
        error_message: err.message,
        duration_ms: Date.now() - startedAt,
      });
    } catch { }
    return res.json({ success: false, error: err.message }, 500);
  }
}
