import { Client, Databases, ID, Permission, Role, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';

ffmpeg.setFfmpegPath(ffmpegStatic);

export default async ({ req, res, log, error }) => {
  let body = {};
  if (req.bodyRaw) try { body = JSON.parse(req.bodyRaw); } catch {}
  if (typeof req.body === 'string') try { body = JSON.parse(req.body); } catch {}
  else if (req.body) body = req.body;
  
  const client = new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
  const storage = new Storage(client);
  const db = new Databases(client);

  try {
    const filesArray = body.files || [];
    if (!Array.isArray(filesArray) || filesArray.length < 2) throw new Error('Provide at least 2 videos');

    const tempInputs = [];
    const decodeBase64Input = (value) => {
      if (!value || typeof value !== 'string') return value;
      const match = value.match(/^data:[^;]+;base64,(.+)$/i);
      return match ? match[1] : value;
    };

    for (let i = 0; i < filesArray.length; i++) {
      const b = filesArray[i];
      let buf;
      if (b.file_base64) buf = Buffer.from(decodeBase64Input(b.file_base64), 'base64');
      else if (b.file_url) { const r = await fetch(b.file_url); buf = Buffer.from(await r.arrayBuffer()); }
      else if (b.file_id) buf = Buffer.from(await storage.getFileDownload(process.env.BUCKET_INPUTS, b.file_id));
      else throw new Error('Missing file data');
      const tmpPath = '/tmp/input-' + Date.now() + '-' + i + '.mp4';
      fs.writeFileSync(tmpPath, buf);
      tempInputs.push(tmpPath);
    }
    const tempOutput = '/tmp/output-' + Date.now() + '.mp4';

    await new Promise((resolve, reject) => {
      let command = ffmpeg();
      tempInputs.forEach(file => command.input(file));
      command.on('end', resolve).on('error', reject).mergeToFile(tempOutput, '/tmp/');
    });

    const outputBuffer = fs.readFileSync(tempOutput);
    const uploaded = await storage.createFile(process.env.BUCKET_OUTPUTS, ID.unique(), InputFile.fromBuffer(outputBuffer, 'merged.mp4'), [Permission.read(Role.any())]);
    const download_url = process.env.APPWRITE_ENDPOINT + '/storage/buckets/' + process.env.BUCKET_OUTPUTS + '/files/' + uploaded.$id + '/download?project=' + process.env.APPWRITE_PROJECT_ID;

    // cleanup
    try {
      tempInputs.forEach(f => fs.unlinkSync(f));
      fs.unlinkSync(tempOutput);
    } catch(e){}

    return res.json({ success: true, download_url, file_id: uploaded.$id, output_filename: 'merged.mp4' });
  } catch (err) {
    error(err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
