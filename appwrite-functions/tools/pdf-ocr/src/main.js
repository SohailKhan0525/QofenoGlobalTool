/**
 * pdf-ocr — Real OCR using pdfjs-dist (render to canvas) + tesseract.js text recognition.
 * For text-based PDFs: returns extracted text or searchable PDF.
 * For scanned PDFs: runs tesseract.js OCR on each page image.
 * Output: searchable PDF (with invisible text layer) or plain .txt
 */
import { Client, Databases, Query, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { ID, Permission, Role } from 'node-appwrite';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { createRequire } from 'module';
import { writeFileSync, existsSync, mkdtempSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const require = createRequire(import.meta.url);
let pdfjsLib, createCanvas;
try {

    // RATE LIMITING
    const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown_ip';
    const hourKey = `${clientIp}_${Math.floor(Date.now() / 3600000)}`;
    
    let isProUser = false;
    if (body.user_id) {
      try {
        const userMeta = await db.getDocument(process.env.DATABASE_ID, 'users_meta', body.user_id);
        if (userMeta && (userMeta.plan === 'pro' || userMeta.plan === 'enterprise')) {
          isProUser = true;
        }
      } catch (err) { /* ignore */ }
    }
    
    const limit = isProUser ? 100 : 20;
    
    try {
      const existing = await db.listDocuments(process.env.DATABASE_ID, 'rate_limits', [
        Query.equal('key', hourKey)
      ]);
      
      if (existing.total > 0) {
        if (existing.documents[0].count >= limit) {
          return res.json({
            success: false,
            error: "Rate limit exceeded. Please wait or upgrade to PRO."
          }, 429);
        } else {
          await db.updateDocument(process.env.DATABASE_ID, 'rate_limits', existing.documents[0].$id, {
            count: existing.documents[0].count + 1,
            updated_at: new Date().toISOString()
          });
        }
      } else {
        await db.createDocument(process.env.DATABASE_ID, 'rate_limits', ID.unique(), {
          key: hourKey,
          ip: clientIp,
          count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      log('Rate limit check failed, skipping: ' + err.message);
    }
    // END RATE LIMITING

  pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
  createCanvas = require('canvas').createCanvas;
} catch (_) {
  pdfjsLib = null;
  createCanvas = null;
}

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

async function uploadOutput(storage, filename, buffer) {
  const file = await storage.createFile(
    process.env.BUCKET_OUTPUTS, ID.unique(),
    InputFile.fromBuffer(buffer, filename),
    [Permission.read(Role.any()), Permission.delete(Role.any())]
  );
  const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '');
  return { file, download_url: `${endpoint}/storage/buckets/${process.env.BUCKET_OUTPUTS}/files/${file.$id}/download?project=${process.env.APPWRITE_PROJECT_ID}` };
}

async function createExecutionRecord(db, payload) {
  try {
    return await db.createDocument(process.env.DATABASE_ID, 'tool_executions', ID.unique(), {
      user_id: payload.user_id || null, tool_slug: payload.tool_slug, tool_name: payload.tool_name,
      category: payload.category || 'PDF & Documents', status: payload.status,
      input_filename: payload.input_filename || null, input_size: payload.input_size || null,
      output_filename: payload.output_filename || null, output_size: payload.output_size || null,
      download_url: payload.download_url || null, error_message: payload.error_message || null,
      duration_ms: payload.duration_ms || null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
  } catch (_) {}
}

async function processWithRetry(processFn, maxRetries = 2) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try { return await processFn(); }
    catch (err) { lastError = err; await new Promise(r => setTimeout(r, 500)); }
  }
  throw lastError;
}

function validatePdfOutput(buffer) {
  if (!buffer || buffer.length === 0) throw new Error('Output file is empty — processing failed');
  const header = buffer.toString('utf8', 0, 5);
  if (header !== '%PDF-') throw new Error('Output is not a valid PDF file');
}

/**
 * Map language names to Tesseract language codes
 */
const LANG_MAP = {
  'english': 'eng', 'spanish': 'spa', 'french': 'fra',
  'german': 'deu', 'arabic': 'ara', 'hindi': 'hin',
  'auto-detect': 'eng', // default to English for auto-detect
  'eng': 'eng', 'spa': 'spa', 'fra': 'fra', 'deu': 'deu',
};

/**
 * Render PDF pages to images and run Tesseract OCR on each.
 * Returns combined OCR text.
 */
async function runOCROnPages(pdfBuffer, langCode, log) {
  if (!pdfjsLib || !createCanvas) {
    log('pdfjs-dist or canvas not available, skipping page rendering');
    return null;
  }

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
  const pdf = await loadingTask.promise;
  const numPages = Math.min(pdf.numPages, 20); // Limit to 20 pages for performance
  const scale = 2.0; // 144 DPI equivalent
  let allText = '';

  log(`Running OCR on ${numPages} pages, lang=${langCode}`);

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');

    await page.render({ canvasContext: ctx, viewport }).promise;

    const imageBuffer = canvas.toBuffer('image/png');

    try {
      const { data } = await Tesseract.recognize(imageBuffer, langCode, {
        logger: () => {}, // suppress verbose output
      });
      allText += `\n\n--- Page ${pageNum} ---\n${data.text}`;
      log(`Page ${pageNum} OCR: ${data.text.length} chars`);
    } catch (ocrErr) {
      log(`OCR failed on page ${pageNum}: ${ocrErr.message}`);
    }
  }

  return allText.trim();
}

/**
 * Build a searchable PDF with extracted text embedded as invisible text layer
 */
async function buildSearchablePDF(originalBuffer, extractedText, inputName, log) {
  const pdfDoc = await PDFDocument.load(originalBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  // Add invisible text overlay on first page only (for searchability marker)
  if (pages.length > 0 && extractedText) {
    const page = pages[0];
    const { height } = page.getSize();
    // Draw text off-page or at 1pt size (invisible but searchable)
    const lines = extractedText.split('\n').filter(l => l.trim()).slice(0, 50);
    let yPos = height - 10;
    for (const line of lines) {
      if (yPos < 10) break;
      page.drawText(line.substring(0, 200), {
        x: 0, y: yPos, size: 1,
        font, color: rgb(1, 1, 1), opacity: 0.01,
      });
      yPos -= 2;
    }
  }

  const outBuf = Buffer.from(await pdfDoc.save({ useObjectStreams: true }));
  validatePdfOutput(outBuf);
  log(`Built searchable PDF: ${outBuf.length} bytes`);
  return outBuf;
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
    const outputType = String(body.output_type || 'Searchable PDF');
    const langInput = String(body.language || 'English').toLowerCase();
    const langCode = LANG_MAP[langInput] || 'eng';

    log(`PDF OCR: file=${inputName}, lang=${langCode}, output=${outputType}`);

    const { outputBuffer, outputName, charCount } = await processWithRetry(async () => {
      // Step 1: Try text extraction with pdf-parse first (fast for text PDFs)
      let extractedText = '';
      try {
        const pdfData = await pdfParse(source.buffer);
        extractedText = pdfData.text || '';
        log(`pdf-parse extracted ${extractedText.length} chars`);
      } catch (parseErr) {
        log(`pdf-parse failed: ${parseErr.message}`);
      }

      // Step 2: If text is too sparse (scanned PDF), run Tesseract OCR
      const isScanned = extractedText.trim().length < 100;
      if (isScanned) {
        log('Sparse text detected, running Tesseract OCR on page images...');
        const ocrText = await runOCROnPages(source.buffer, langCode, log);
        if (ocrText) extractedText = ocrText;
      }

      if (outputType === 'Text file (.txt)') {
        const outBuf = Buffer.from(extractedText || 'No text content could be extracted from this PDF.', 'utf8');
        const outName = inputName.replace(/\.pdf$/i, '') + '-ocr.txt';
        return { outputBuffer: outBuf, outputName: outName, charCount: extractedText.length };
      }

      // Build searchable PDF
      const outBuf = await buildSearchablePDF(source.buffer, extractedText, inputName, log);
      const outName = inputName.replace(/\.pdf$/i, '') + '-searchable.pdf';
      return { outputBuffer: outBuf, outputName: outName, charCount: extractedText.length };
    });

    const uploaded = await uploadOutput(storage, outputName, outputBuffer);
    await createExecutionRecord(db, {
      user_id: body.user_id || null, tool_slug: 'pdf-ocr', tool_name: 'PDF OCR',
      status: 'completed', input_filename: inputName, input_size: source.buffer.length,
      output_filename: outputName, output_size: outputBuffer.length,
      download_url: uploaded.download_url, duration_ms: Date.now() - startedAt,
    });

    return res.json({
      success: true, output_filename: outputName, output_size: outputBuffer.length,
      characters_extracted: charCount,
      download_url: uploaded.download_url, file_id: uploaded.file.$id,
      duration_ms: Date.now() - startedAt,
    });
  } catch (err) {
    error(err.message);
    await createExecutionRecord(db, {
      user_id: body.user_id || null, tool_slug: 'pdf-ocr', tool_name: 'PDF OCR',
      status: 'error', input_filename: body.input_filename || body.filename || null,
      error_message: err.message, duration_ms: Date.now() - startedAt,
    });
    return res.json({ success: false, error: err.message }, 500);
  }
};
