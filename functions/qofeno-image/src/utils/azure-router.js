import fetch from "node-fetch";
import { ID, Permission, Role, Query } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

const DEFAULT_AZURE_URL = "https://qofeno-processor.gentleforest-5357c740.centralindia.azurecontainerapps.io";

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

    const endpointPath = azureEndpoint || (
      cKey === "pdf" ? `/pdf/${tool.replace(/^pdf-/, '')}` :
      cKey === "image" ? `/image/${tool.replace(/^image-/, '')}` :
      `/media/${tool}`
    );

    const targetUrl = `${containerBase.replace(/\/$/, '')}${endpointPath}`;
    const secret = process.env.QOFENO_CONTAINER_SECRET || "qofeno_azure_secret_key_2024";

    // 1. Cold-start check / Ping container /health endpoint with retries
    let awake = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const ping = await fetch(`${containerBase.replace(/\/$/, '')}/health`, {
          headers: { "Authorization": `Bearer ${secret}` },
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
        fileBuffer = Buffer.from(downloaded);
      } catch (err) {
        if (log) log(`Failed to download input file from storage: ${err.message}`);
        if (fallbackHandler) return await fallbackHandler(ctx);
        return { success: false, error: `Failed to retrieve input file from storage: ${err.message}` };
      }
    }

    // 3. Post request to Azure container endpoint
    const FormData = (await import("form-data")).default;
    const form = new FormData();
    form.append("tool", tool);
    form.append("params", JSON.stringify(params || {}));

    if (fileBuffer) {
      form.append("file", fileBuffer, { filename: inputFilename });
    }

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secret}`,
        ...form.getHeaders()
      },
      timeout: 300000 // 5 minute execution limit for heavy jobs
    });

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
    const ep = (process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1').replace(/\/$/, '');
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
