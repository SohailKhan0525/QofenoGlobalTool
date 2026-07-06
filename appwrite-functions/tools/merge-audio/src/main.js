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

  async function uploadOutput(storageClient, filename, buffer) {
    const fileForUpload = InputFile.fromBuffer(buffer, filename);
    const uploaded = await storageClient.createFile(process.env.BUCKET_OUTPUTS, ID.unique(), fileForUpload, [Permission.read(Role.any())]);
    const download_url = process.env.APPWRITE_ENDPOINT + '/storage/buckets/' + process.env.BUCKET_OUTPUTS + '/files/' + uploaded.$id + '/download?project=' + process.env.APPWRITE_PROJECT_ID;
    return { file: uploaded, download_url };
  }

  try {
    const filesArray = body.files || [];
    if (!Array.isArray(filesArray) || filesArray.length < 2) {
      throw new Error('Please provide at least 2 files to merge.');
    }

    const tempInputs = [];
    const tempOutput = '/tmp/output-merged-' + Date.now() + '.mp3';
    let inputSize = 0;

    for (let i = 0; i < filesArray.length; i++) {
      const b = filesArray[i];
      let buf;
      if (b.file_base64) {
        const raw = decodeBase64Input(b.file_base64);
      buf = Buffer.from(raw, 'base64');
      } else if (b.file_url) {
        const response = await fetch(b.file_url);
        buf = Buffer.from(await response.arrayBuffer());
      } else if (b.file_id) {
        buf = Buffer.from(await storage.getFileDownload(process.env.BUCKET_INPUTS, b.file_id));
      } else {
        throw new Error('No file data provided in file ' + i);
      }
      
      const tmpPath = '/tmp/input-' + Date.now() + '-' + i + '.mp3';
      fs.writeFileSync(tmpPath, buf);
      tempInputs.push(tmpPath);
      inputSize += buf.length;
    }

    await new Promise((resolve, reject) => {
      let command = ffmpeg();
      tempInputs.forEach(file => command.input(file));
      command
        .on('end', resolve)
        .on('error', (err) => reject(new Error('Merge Error: ' + err.message)))
        .mergeToFile(tempOutput, '/tmp/');
    });

    const outputBuffer = fs.readFileSync(tempOutput);
    const outputName = body.output_filename || 'merged.mp3';
    const uploaded = await uploadOutput(storage, outputName, outputBuffer);

    // cleanup
    try { 
      tempInputs.forEach(f => fs.unlinkSync(f));
      fs.unlinkSync(tempOutput); 
    } catch(e){}

    await createExecution(db, {
      user_id: body.user_id || null,
      tool_slug: 'merge-audio',
      tool_name: 'merge-audio',
      category: 'Audio Tools',
      status: 'completed',
      input_filename: 'multiple files',
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
        tool_slug: 'merge-audio',
        tool_name: 'merge-audio',
        category: 'Audio Tools',
        status: 'error',
        input_filename: 'multiple files',
        error_message: err.message,
        duration_ms: Date.now() - startedAt,
      });
    } catch {}
    return res.json({ success: false, error: err.message }, 500);
  }
};
