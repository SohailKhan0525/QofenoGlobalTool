/**
 * pdf-header-footer — Add header and/or footer text to every page of a PDF.
 * Uses pdf-lib.
 */
import { Client, Databases, Query, ID, Permission, Role, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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
  return { buffer: Buffer.from(base64, 'base64'), mimeType: 'application/pdf' };
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

    return await db.createDocument(process.env.DATABASE_ID, 'tool_executions', ID.unique(), {
      user_id: payload.user_id || null, tool_slug: payload.tool_slug, tool_name: payload.tool_name,
      category: 'PDF & Documents', status: payload.status,
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

/**
 * Resolve template variables in header/footer text:
 * {page} → current page number
 * {total} → total pages
 * {date} → current date
 */
function resolveTemplate(template, pageNum, total) {
  return template
    .replace(/\{page\}/gi, String(pageNum))
    .replace(/\{total\}/gi, String(total))
    .replace(/\{date\}/gi, new Date().toLocaleDateString());
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
    const headerText = String(body.header_text || body.header || '').trim();
    const footerText = String(body.footer_text || body.footer || '').trim();
    const fontSize = Math.max(6, Math.min(24, parseInt(body.font_size || '10', 10)));
    const margin = Math.max(5, Math.min(50, parseInt(body.margin || '20', 10)));
    const alignment = String(body.alignment || 'center').toLowerCase(); // left | center | right

    if (!headerText && !footerText) {
      throw new Error('At least one of header_text or footer_text is required');
    }

    const { outputBuffer, outputName } = await processWithRetry(async () => {
      const pdfDoc = await PDFDocument.load(source.buffer, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const total = pages.length;

      pages.forEach((page, idx) => {
        const { width, height } = page.getSize();
        const pageNum = idx + 1;

        const draw = (text, y) => {
          if (!text) return;
          const resolved = resolveTemplate(text, pageNum, total);
          const textWidth = font.widthOfTextAtSize(resolved, fontSize);
          let x = margin;
          if (alignment === 'center') x = (width - textWidth) / 2;
          else if (alignment === 'right') x = width - textWidth - margin;

          page.drawText(resolved, { x, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
        };

        // Header at top
        draw(headerText, height - margin - fontSize);
        // Footer at bottom
        draw(footerText, margin);
      });

      const outBuf = Buffer.from(await pdfDoc.save({ useObjectStreams: true }));
      const outName = inputName.replace(/\.pdf$/i, '') + '-header-footer.pdf';

      if (!outBuf || outBuf.length === 0) throw new Error('Output file is empty');
      if (outBuf.toString('utf8', 0, 5) !== '%PDF-') throw new Error('Output is not a valid PDF');

      log(`Added header/footer to ${total} pages`);
      return { outputBuffer: outBuf, outputName: outName };
    });

    const uploaded = await uploadOutput(storage, outputName, outputBuffer);
    await createExecutionRecord(db, {
      user_id: body.user_id || null, tool_slug: 'pdf-header-footer', tool_name: 'PDF Header/Footer Editor',
      status: 'completed', input_filename: inputName, input_size: source.buffer.length,
      output_filename: outputName, output_size: outputBuffer.length,
      download_url: uploaded.download_url, duration_ms: Date.now() - startedAt,
    });

    return res.json({
      success: true, output_filename: outputName, output_size: outputBuffer.length,
      download_url: uploaded.download_url, file_id: uploaded.file.$id, duration_ms: Date.now() - startedAt,
    });
  } catch (err) {
    error(err.message);
    await createExecutionRecord(db, {
      user_id: body.user_id || null, tool_slug: 'pdf-header-footer', tool_name: 'PDF Header/Footer Editor',
      status: 'error', input_filename: body.input_filename || null,
      error_message: err.message, duration_ms: Date.now() - startedAt,
    });
    return res.json({ success: false, error: err.message }, 500);
  }
};
