import fetch from "node-fetch";
import { ID, Permission, Role, Query } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

const DEFAULT_AZURE_URL = "https://qofeno-processor.gentleforest-5357c740.centralindia.azurecontainerapps.io";

const ROUTE_MAP = {
  // PDF tools
  'pdf-compress': '/pdf/compress',
  'pdf-compressor': '/pdf/compress',
  'pdf-reduce-resolution': '/pdf/compress',
  'pdf-to-word': '/pdf/to-word',
  'pdf-ocr': '/pdf/ocr',
  'pdf-extract-tables': '/pdf/extract-tables',
  'pdf-table-to-excel': '/pdf/extract-tables',
  'pdf-table-to-csv': '/pdf/extract-tables',
  'pdf-to-excel': '/pdf/extract-tables',

  // Media / Video / Audio tools
  'video-compress': '/video/compress',
  'video-compressor': '/video/compress',
  'audio-convert': '/audio/convert',
  'audio-converter': '/audio/convert',
  'audio-to-mp3': '/audio/convert',

  // Image tools
  'image-bg-remove': '/image/bg-remove',
  'bg-remove': '/image/bg-remove',
  'image-remove-bg': '/image/bg-remove'
};

function getMimeType(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (['png','jpg','jpeg','webp','gif'].includes(ext)) return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  if (['mp4','webm','mkv','avi'].includes(ext)) return `video/${ext}`;
  if (['mp3','wav','ogg','flac','aac'].includes(ext)) return `audio/${ext}`;
  return 'application/octet-stream';
}

export async function routeToAzure({ file_id, file_ids, tool, params, storage, db, log, containerKey, azureEndpoint, fallbackHandler, ctx }) {
  const startTime = Date.now();

  try {
    // Check if Azure is disabled via Appwrite settings (e.g. credit < $10)
    if (db) {
      try {
        const disabledSetting = await db.listDocuments(process.env.DATABASE_ID || "qofeno_db", "settings", [
          Query.equal("key", "azure_disabled"), Query.limit(1)
        ]);
        if (disabledSetting.total > 0 && disabledSetting.documents[0].value === "true") {
          if (log) log("Azure disabled (credit low) — falling back to local Appwrite handler");
          if (fallbackHandler) return await fallbackHandler(ctx);
        }
      } catch {}
    }

    const cKey = containerKey || (
      tool.startsWith("video-") || tool.startsWith("audio-")
        ? "media"
        : tool.startsWith("image-") || ["heic-","raw-","png-to-svg"].some(p => tool.startsWith(p))
        ? "image"
        : "pdf"
    );

    let containerBase = process.env.AZURE_PROCESSOR_URL || process.env.AZURE_PDF_CONTAINER_URL;

    // If env var is missing, query database settings
    if (!containerBase && db) {
      try {
        const urlDoc = await db.listDocuments(process.env.DATABASE_ID || "qofeno_db", "settings", [
          Query.equal("key", "azure_processor_url"), Query.limit(1)
        ]);
        if (urlDoc.documents.length > 0 && urlDoc.documents[0].value) {
          containerBase = urlDoc.documents[0].value;
        }
      } catch {}
    }

    if (!containerBase) {
      containerBase = DEFAULT_AZURE_URL;
    }

    const normalizedTool = String(tool || '').toLowerCase();
    const endpointPath = azureEndpoint || ROUTE_MAP[normalizedTool] || (
      cKey === "pdf" ? `/pdf/${normalizedTool.replace(/^pdf-/, '')}` :
      cKey === "image" ? `/image/${normalizedTool.replace(/^image-/, '')}` :
      `/media/${normalizedTool}`
    );

    const targetUrl = `${containerBase.replace(/\/$/, '')}${endpointPath}`;

    const secretsToTry = Array.from(new Set([
      process.env.QOFENO_CONTAINER_SECRET,
      "e4f9b8c2d1a3e5f7a9b0c2d4e6f8a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5",
      "qofeno_azure_secret_key_2024"
    ].filter(Boolean)));

    let validSecret = secretsToTry[0];

    // 1. Cold-start check / Ping container /health endpoint with retries
    let awake = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const ping = await fetch(`${containerBase.replace(/\/$/, '')}/health`, {
          headers: { "Authorization": `Bearer ${validSecret}` },
          timeout: 4000
        });
        if (ping.ok) {
          awake = true;
          break;
        }
      } catch {
        if (log) log(`Azure Container ${cKey} starting up (Attempt ${attempt}/3)...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (!awake && fallbackHandler) {
      if (log) log(`Azure Container ${cKey} not responding — executing local fallback handler...`);
      return await fallbackHandler(ctx);
    }

    // 2. Fetch input file buffer from Appwrite storage if file_id is provided
    let fileBuffer = null;
    let inputFilename = (params && params.input_filename) || `${tool}-input.bin`;
    const bucketId = (params && params.bucket_id) || process.env.BUCKET_INPUTS || "tool_inputs";

    if (file_id) {
      try {
        const downloaded = await storage.getFileDownload(bucketId, file_id);
        fileBuffer = Buffer.isBuffer(downloaded) ? downloaded : Buffer.from(downloaded);
        if (log) log(`Downloaded file from Appwrite storage: ${fileBuffer.length} bytes`);
      } catch (err) {
        if (log) log(`Failed to download input file from storage: ${err.message}`);
        if (fallbackHandler) return await fallbackHandler(ctx);
        return { success: false, error: `Failed to retrieve input file from storage: ${err.message}` };
      }
    }

    // 3. Post request to Azure container endpoint
    const FormData = (await import("form-data")).default;
    let response = null;
    let lastErr = null;

    // Try posting request with secrets
    for (const sec of secretsToTry) {
      try {
        const testForm = new FormData();
        
        // Append all parameters directly as Form fields for FastAPI compatibility
        if (params && typeof params === "object") {
          for (const [k, v] of Object.entries(params)) {
            if (v !== undefined && v !== null && k !== "input_filename" && k !== "bucket_id") {
              testForm.append(k, String(v));
            }
          }
        }

        if (fileBuffer) {
          testForm.append("file", fileBuffer, {
            filename: inputFilename,
            contentType: getMimeType(inputFilename)
          });
        }

        response = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${sec}`,
            ...testForm.getHeaders()
          },
          body: testForm,
          timeout: 300000
        });

        if (response.status !== 403) {
          break; // Authenticated successfully
        }
      } catch (err) {
        lastErr = err;
      }
    }

    if (!response) {
      if (fallbackHandler) return await fallbackHandler(ctx);
      return { success: false, error: `Azure connection failed: ${lastErr?.message || 'Network error'}` };
    }

    if (!response.ok) {
      const errText = await response.text();
      if (log) log(`Azure processing returned status ${response.status}: ${errText}`);
      if (fallbackHandler) return await fallbackHandler(ctx);
      return { success: false, error: `Azure processing failed [${response.status}]: ${errText || response.statusText}` };
    }

    const outputBuffer = Buffer.from(await response.arrayBuffer());
    const outputFilename = response.headers.get("x-output-filename") || `pro_${tool}_output.bin`;

    // 4. Save output file to Appwrite storage
    const outputBucket = process.env.BUCKET_OUTPUTS || "tool_outputs";
    const ep = (process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1').replace(/\/$/, '');
    const projId = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID || '69c58725000ef2b43f18';

    const savedFile = await storage.createFile(
      outputBucket,
      ID.unique(),
      InputFile.fromBuffer(outputBuffer, outputFilename),
      [Permission.read(Role.any()), Permission.delete(Role.any())]
    );

    const downloadUrl = `${ep}/storage/buckets/${outputBucket}/files/${savedFile.$id}/download?project=${projId}`;
    const durationMs = Date.now() - startTime;

    return {
      success: true,
      file_id: savedFile.$id,
      download_url: downloadUrl,
      output_filename: outputFilename,
      output_size: outputBuffer.length,
      duration_ms: durationMs,
      backend: "azure",
      container: cKey
    };
  } catch (err) {
    if (log) log(`routeToAzure outer error: ${err.message}`);
    if (fallbackHandler) {
      try {
        return await fallbackHandler(ctx);
      } catch (fbErr) {
        return { success: false, error: fbErr.message || 'Processing failed' };
      }
    }
    return { success: false, error: err.message || 'Cloud processing failed' };
  }
}
