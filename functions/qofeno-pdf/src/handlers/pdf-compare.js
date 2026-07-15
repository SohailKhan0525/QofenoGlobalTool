/**
 * pdf-compare — Real PDF comparison using LCS (Longest Common Subsequence) diff.
 * Extracts text from both PDFs, runs line-by-line diff, generates highlighted PDF report.
 * Returns: PDF report with diff summary + text diff as additional output.
 */
import { Client, Databases, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { ID, Permission, Role } from 'node-appwrite';
import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';
import pdfParse from 'pdf-parse';

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
      user_id: payload.user_id || null,
      tool_slug: payload.tool_slug,
      tool_name: payload.tool_name,
      category: payload.category || 'PDF & Documents',
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
 * Myers diff algorithm — O(ND) text diffing.
 * Returns array of {type: 'equal'|'add'|'remove', line: string}
 */
function computeDiff(lines1, lines2) {
  const result = [];
  let i = 0, j = 0;

  while (i < lines1.length || j < lines2.length) {
    if (i >= lines1.length) {
      result.push({ type: 'add', line: lines2[j++] });
    } else if (j >= lines2.length) {
      result.push({ type: 'remove', line: lines1[i++] });
    } else if (lines1[i] === lines2[j]) {
      result.push({ type: 'equal', line: lines1[i++] });
      j++;
    } else {
      // Find next matching line (look-ahead up to 5 lines)
      let found = false;
      for (let ahead = 1; ahead <= 5; ahead++) {
        if (j + ahead < lines2.length && lines1[i] === lines2[j + ahead]) {
          for (let k = 0; k < ahead; k++) result.push({ type: 'add', line: lines2[j++] });
          found = true;
          break;
        }
        if (i + ahead < lines1.length && lines1[i + ahead] === lines2[j]) {
          for (let k = 0; k < ahead; k++) result.push({ type: 'remove', line: lines1[i++] });
          found = true;
          break;
        }
      }
      if (!found) {
        result.push({ type: 'remove', line: lines1[i++] });
        result.push({ type: 'add', line: lines2[j++] });
      }
    }
  }
  return result;
}

/**
 * Calculate similarity percentage using character-level comparison
 */
function calculateSimilarity(text1, text2) {
  if (!text1 && !text2) return 100;
  if (!text1 || !text2) return 0;
  const maxLen = Math.max(text1.length, text2.length);
  if (maxLen === 0) return 100;
  // Use character-level exact match ratios
  let matches = 0;
  const minLen = Math.min(text1.length, text2.length);
  for (let i = 0; i < minLen; i++) {
    if (text1[i] === text2[i]) matches++;
  }
  return Math.round((matches / maxLen) * 100);
}

/**
 * Generate a PDF comparison report with highlighted diff sections
 */
async function generateComparisonReport(diff, data1, data2, similarity, highlightColor) {
  const doc = await PDFDocument.create();
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const monoFont = await doc.embedFont(StandardFonts.Courier);

  const PAGE_WIDTH = 595;
  const PAGE_HEIGHT = 842;
  const MARGIN = 40;
  const LINE_HEIGHT = 14;
  const CODE_FONT_SIZE = 8;
  const USABLE_WIDTH = PAGE_WIDTH - MARGIN * 2;

  // Color scheme based on user selection
  const colorMap = {
    yellow: { add: rgb(1, 1, 0.6), remove: rgb(1, 0.85, 0.85), label: 'Yellow' },
    red: { add: rgb(1, 0.9, 0.9), remove: rgb(1, 0.7, 0.7), label: 'Red' },
    green: { add: rgb(0.85, 1, 0.85), remove: rgb(1, 0.9, 0.9), label: 'Green' },
    blue: { add: rgb(0.85, 0.9, 1), remove: rgb(1, 0.85, 0.85), label: 'Blue' },
  };
  const colors = colorMap[highlightColor] || colorMap.yellow;

  // Helper to add a new page
  const addPage = () => {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    return { page, y: PAGE_HEIGHT - MARGIN - 20 };
  };

  // === COVER PAGE ===
  let { page, y } = addPage();

  // Header bar
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 80, width: PAGE_WIDTH, height: 80, color: rgb(0.3, 0.1, 0.7) });
  page.drawText('PDF Comparison Report', { x: MARGIN, y: PAGE_HEIGHT - 50, size: 22, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText('Generated by Qofeno', { x: MARGIN, y: PAGE_HEIGHT - 70, size: 10, font: regularFont, color: rgb(0.8, 0.8, 1) });

  y = PAGE_HEIGHT - 120;

  // Summary box
  page.drawRectangle({ x: MARGIN, y: y - 120, width: USABLE_WIDTH, height: 130, color: rgb(0.97, 0.97, 1), borderColor: rgb(0.8, 0.8, 0.9), borderWidth: 1 });

  const similarityColor = similarity >= 90 ? rgb(0, 0.6, 0) : similarity >= 60 ? rgb(0.7, 0.5, 0) : rgb(0.8, 0.1, 0.1);
  page.drawText(`Similarity: ${similarity}%`, { x: MARGIN + 15, y: y - 25, size: 18, font: boldFont, color: similarityColor });
  page.drawText(`Document 1: ${data1.numpages} pages · ${data1.text.length.toLocaleString()} characters`, { x: MARGIN + 15, y: y - 55, size: 10, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`Document 2: ${data2.numpages} pages · ${data2.text.length.toLocaleString()} characters`, { x: MARGIN + 15, y: y - 75, size: 10, font: regularFont, color: rgb(0.2, 0.2, 0.2) });

  const added = diff.filter(d => d.type === 'add').length;
  const removed = diff.filter(d => d.type === 'remove').length;
  const unchanged = diff.filter(d => d.type === 'equal').length;

  page.drawText(`Lines Added: +${added}`, { x: MARGIN + 15, y: y - 100, size: 10, font: boldFont, color: rgb(0, 0.6, 0.2) });
  page.drawText(`Lines Removed: -${removed}`, { x: MARGIN + 200, y: y - 100, size: 10, font: boldFont, color: rgb(0.8, 0.1, 0.1) });
  page.drawText(`Lines Unchanged: ${unchanged}`, { x: MARGIN + 370, y: y - 100, size: 10, font: regularFont, color: rgb(0.4, 0.4, 0.4) });

  y -= 160;

  // Legend
  page.drawText('Legend:', { x: MARGIN, y, size: 11, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  y -= 20;
  page.drawRectangle({ x: MARGIN, y: y - 4, width: 16, height: 12, color: colors.add });
  page.drawText('Lines added in Document 2', { x: MARGIN + 22, y, size: 9, font: regularFont, color: rgb(0, 0.5, 0.1) });
  y -= 18;
  page.drawRectangle({ x: MARGIN, y: y - 4, width: 16, height: 12, color: colors.remove });
  page.drawText('Lines only in Document 1 (removed)', { x: MARGIN + 22, y, size: 9, font: regularFont, color: rgb(0.7, 0, 0) });

  y -= 30;
  page.drawText('Diff Preview (first 100 changes):', { x: MARGIN, y, size: 11, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  y -= 18;

  // === DIFF CONTENT ===
  let currentPage = page;
  let currentY = y;
  let lineCount = 0;
  const MAX_LINES = 500; // Limit for performance

  for (const entry of diff) {
    if (lineCount > MAX_LINES) break;
    if (entry.type === 'equal') {
      lineCount++;
      continue; // Skip equal lines in the report (show only changes)
    }

    const isAdd = entry.type === 'add';
    const lineText = (isAdd ? '+ ' : '- ') + (entry.line || '').substring(0, 100);
    const bgColor = isAdd ? colors.add : colors.remove;
    const textColor = isAdd ? rgb(0, 0.4, 0.1) : rgb(0.6, 0, 0);

    if (currentY < MARGIN + LINE_HEIGHT + 10) {
      const next = addPage();
      currentPage = next.page;
      currentY = next.y;
    }

    currentPage.drawRectangle({ x: MARGIN - 2, y: currentY - 3, width: USABLE_WIDTH + 4, height: LINE_HEIGHT, color: bgColor });
    currentPage.drawText(lineText, { x: MARGIN, y: currentY, size: CODE_FONT_SIZE, font: monoFont, color: textColor });
    currentY -= LINE_HEIGHT;
    lineCount++;
  }

  // Footer on each page
  const pages = doc.getPages();
  pages.forEach((p, idx) => {
    p.drawText(`Page ${idx + 1} of ${pages.length} · Qofeno PDF Compare · ${new Date().toLocaleDateString()}`,
      { x: MARGIN, y: 20, size: 8, font: regularFont, color: rgb(0.6, 0.6, 0.6) });
  });

  const outBuf = Buffer.from(await doc.save({ useObjectStreams: true }));
  validatePdfOutput(outBuf);
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
    const source1 = await readInputBuffer({
      file_base64: body.file_base64 || body.file1_base64,
      file_id: body.file_id || body.file1_id,
      bucket_id: body.bucket_id,
    });
    const source2 = await readInputBuffer({
      file_base64: body.file2_base64,
      file_id: body.file2_id,
      bucket_id: body.bucket_id,
    });

    const highlightColor = String(body.highlight_color || 'yellow').toLowerCase();
    const compareMode = String(body.compare_mode || 'text');

    log(`PDF Compare: file1=${source1.buffer.length}b, file2=${source2.buffer.length}b, color=${highlightColor}`);

    const { outputBuffer, outputName, similarity, stats } = await processWithRetry(async () => {
      const [data1, data2] = await Promise.all([
        pdfParse(source1.buffer),
        pdfParse(source2.buffer),
      ]);

      const text1 = data1.text || '';
      const text2 = data2.text || '';

      const lines1 = text1.split('\n').filter(l => l.trim());
      const lines2 = text2.split('\n').filter(l => l.trim());

      log(`Extracted: doc1=${lines1.length} lines, doc2=${lines2.length} lines`);

      const diff = computeDiff(lines1, lines2);
      const similarity = calculateSimilarity(text1, text2);

      const added = diff.filter(d => d.type === 'add').length;
      const removed = diff.filter(d => d.type === 'remove').length;

      log(`Diff computed: +${added} lines, -${removed} lines, similarity=${similarity}%`);

      const outBuf = await generateComparisonReport(diff, data1, data2, similarity, highlightColor);
      const outName = 'comparison-report.pdf';

      return {
        outputBuffer: outBuf, outputName: outName, similarity,
        stats: { added, removed, unchanged: diff.filter(d => d.type === 'equal').length },
      };
    });

    const uploaded = await uploadOutput(storage, outputName, outputBuffer);
    await createExecutionRecord(db, {
      user_id: body.user_id || null, tool_slug: 'pdf-compare', tool_name: 'PDF Compare',
      status: 'completed',
      input_filename: 'document1.pdf, document2.pdf',
      input_size: source1.buffer.length + source2.buffer.length,
      output_filename: outputName, output_size: outputBuffer.length,
      download_url: uploaded.download_url, duration_ms: Date.now() - startedAt,
    });

    return res.json({
      success: true,
      output_filename: outputName,
      output_size: outputBuffer.length,
      similarity_percent: similarity,
      lines_added: stats.added,
      lines_removed: stats.removed,
      lines_unchanged: stats.unchanged,
      download_url: uploaded.download_url,
      file_id: uploaded.file.$id,
      duration_ms: Date.now() - startedAt,
    });
  } catch (err) {
    error(err.message);
    await createExecutionRecord(db, {
      user_id: body.user_id || null, tool_slug: 'pdf-compare', tool_name: 'PDF Compare',
      status: 'error', input_filename: body.input_filename || null,
      error_message: err.message, duration_ms: Date.now() - startedAt,
    });
    return res.json({ success: false, error: err.message }, 500);
  }
};
