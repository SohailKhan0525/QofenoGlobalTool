import { Account, Client, Databases, Functions, Realtime, Storage, Query } from 'appwrite';
import { captureException } from './sentry';


const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
const endpoint = env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = env.VITE_APPWRITE_PROJECT_ID || '69c58725000ef2b43f18';

export const DATABASE_ID = env.VITE_APPWRITE_DATABASE_ID || 'qofeno_db';

export const FUNCTION_IDS = {
  // Platform
  trackEvent:           env.VITE_APPWRITE_FUNCTION_TRACK_EVENT_ID || 'track-event',
  authWebhook:          env.VITE_APPWRITE_FUNCTION_AUTH_WEBHOOK_ID || 'auth-webhook',
  paymentWebhook:       env.VITE_APPWRITE_FUNCTION_PAYMENT_WEBHOOK_ID || 'payment-webhook',
  createDownloadLink:   env.VITE_APPWRITE_FUNCTION_CREATE_DOWNLOAD_LINK_ID || 'create-download-link',
  contactForm:          env.VITE_APPWRITE_FUNCTION_CONTACT_FORM_ID || 'contact-form',

  // Tools
  aacConverter             : env.VITE_APPWRITE_FUNCTION_AAC_CONVERTER_ID || 'aac-converter',
  audioCompressor          : env.VITE_APPWRITE_FUNCTION_AUDIO_COMPRESSOR_ID || 'audio-compressor',
  audioMetadataViewer      : env.VITE_APPWRITE_FUNCTION_AUDIO_METADATA_VIEWER_ID || 'audio-metadata-viewer',
  audioReverser            : env.VITE_APPWRITE_FUNCTION_AUDIO_REVERSER_ID || 'audio-reverser',
  aviConverter             : env.VITE_APPWRITE_FUNCTION_AVI_CONVERTER_ID || 'avi-converter',
  backgroundNoiseRemover   : env.VITE_APPWRITE_FUNCTION_BACKGROUND_NOISE_REMOVER_ID || 'background-noise-remover',
  base64Encoder            : env.VITE_APPWRITE_FUNCTION_BASE64_ENCODER_ID || 'base64-encoder',
  bassBooster              : env.VITE_APPWRITE_FUNCTION_BASS_BOOSTER_ID || 'bass-booster',
  batchCompressPdfs        : env.VITE_APPWRITE_FUNCTION_BATCH_COMPRESS_PDFS_ID || 'batch-compress-pdfs',
  batchConvertPdfs         : env.VITE_APPWRITE_FUNCTION_BATCH_CONVERT_PDFS_ID || 'batch-convert-pdfs',
  batchMergePdfs           : env.VITE_APPWRITE_FUNCTION_BATCH_MERGE_PDFS_ID || 'batch-merge-pdfs',
  blurImage                : env.VITE_APPWRITE_FUNCTION_BLUR_IMAGE_ID || 'blur-image',
  brightnessAdjust         : env.VITE_APPWRITE_FUNCTION_BRIGHTNESS_ADJUST_ID || 'brightness-adjust',
  changePitch              : env.VITE_APPWRITE_FUNCTION_CHANGE_PITCH_ID || 'change-pitch',
  changeSpeed              : env.VITE_APPWRITE_FUNCTION_CHANGE_SPEED_ID || 'change-speed',
  contrastAdjust           : env.VITE_APPWRITE_FUNCTION_CONTRAST_ADJUST_ID || 'contrast-adjust',
  cropImage                : env.VITE_APPWRITE_FUNCTION_CROP_IMAGE_ID || 'crop-image',
  excelToPdf               : env.VITE_APPWRITE_FUNCTION_EXCEL_TO_PDF_ID || 'excel-to-pdf',
  extractAudio             : env.VITE_APPWRITE_FUNCTION_EXTRACT_AUDIO_ID || 'extract-audio',
  fadeIn                   : env.VITE_APPWRITE_FUNCTION_FADE_IN_ID || 'fade-in',
  fadeOut                  : env.VITE_APPWRITE_FUNCTION_FADE_OUT_ID || 'fade-out',
  flacConverter            : env.VITE_APPWRITE_FUNCTION_FLAC_CONVERTER_ID || 'flac-converter',
  flipImage                : env.VITE_APPWRITE_FUNCTION_FLIP_IMAGE_ID || 'flip-image',
  gifMakerVideo            : env.VITE_APPWRITE_FUNCTION_GIF_MAKER_VIDEO_ID || 'gif-maker-video',
  imageBgRemover           : env.VITE_APPWRITE_FUNCTION_IMAGE_BG_REMOVER_ID || 'image-bg-remover',
  imageCompressor          : env.VITE_APPWRITE_FUNCTION_IMAGE_COMPRESSOR_ID || 'image-compressor',
  imageConverter           : env.VITE_APPWRITE_FUNCTION_IMAGE_CONVERTER_ID || 'image-converter',
  imageResizer             : env.VITE_APPWRITE_FUNCTION_IMAGE_RESIZER_ID || 'image-resizer',
  jpgToPdf                 : env.VITE_APPWRITE_FUNCTION_JPG_TO_PDF_ID || 'jpg-to-pdf',
  jsonFormatter            : env.VITE_APPWRITE_FUNCTION_JSON_FORMATTER_ID || 'json-formatter',
  mergeAudio               : env.VITE_APPWRITE_FUNCTION_MERGE_AUDIO_ID || 'merge-audio',
  mergeVideos              : env.VITE_APPWRITE_FUNCTION_MERGE_VIDEOS_ID || 'merge-videos',
  movConverter             : env.VITE_APPWRITE_FUNCTION_MOV_CONVERTER_ID || 'mov-converter',
  mp3Converter             : env.VITE_APPWRITE_FUNCTION_MP3_CONVERTER_ID || 'mp3-converter',
  mp4Converter             : env.VITE_APPWRITE_FUNCTION_MP4_CONVERTER_ID || 'mp4-converter',
  oggConverter             : env.VITE_APPWRITE_FUNCTION_OGG_CONVERTER_ID || 'ogg-converter',
  pdfBookletCreator        : env.VITE_APPWRITE_FUNCTION_PDF_BOOKLET_CREATOR_ID || 'pdf-booklet-creator',
  pdfColorConverter        : env.VITE_APPWRITE_FUNCTION_PDF_COLOR_CONVERTER_ID || 'pdf-color-converter',
  pdfCompare               : env.VITE_APPWRITE_FUNCTION_PDF_COMPARE_ID || 'pdf-compare',
  pdfCompressor            : env.VITE_APPWRITE_FUNCTION_PDF_COMPRESSOR_ID || 'pdf-compressor',
  pdfCrop                  : env.VITE_APPWRITE_FUNCTION_PDF_CROP_ID || 'pdf-crop',
  pdfDeletePages           : env.VITE_APPWRITE_FUNCTION_PDF_DELETE_PAGES_ID || 'pdf-delete-pages',
  pdfExtractPages          : env.VITE_APPWRITE_FUNCTION_PDF_EXTRACT_PAGES_ID || 'pdf-extract-pages',
  pdfFlatten               : env.VITE_APPWRITE_FUNCTION_PDF_FLATTEN_ID || 'pdf-flatten',
  pdfFormCreator           : env.VITE_APPWRITE_FUNCTION_PDF_FORM_CREATOR_ID || 'pdf-form-creator',
  pdfFormFiller            : env.VITE_APPWRITE_FUNCTION_PDF_FORM_FILLER_ID || 'pdf-form-filler',
  pdfGrayscale             : env.VITE_APPWRITE_FUNCTION_PDF_GRAYSCALE_ID || 'pdf-grayscale',
  pdfHeaderFooter          : env.VITE_APPWRITE_FUNCTION_PDF_HEADER_FOOTER_ID || 'pdf-header-footer',
  pdfMerger                : env.VITE_APPWRITE_FUNCTION_PDF_MERGER_ID || 'pdf-merger',
  pdfMetadataEditor        : env.VITE_APPWRITE_FUNCTION_PDF_METADATA_EDITOR_ID || 'pdf-metadata-editor',
  pdfMetadataViewer        : env.VITE_APPWRITE_FUNCTION_PDF_METADATA_VIEWER_ID || 'pdf-metadata-viewer',
  pdfOcr                   : env.VITE_APPWRITE_FUNCTION_PDF_OCR_ID || 'pdf-ocr',
  pdfPageExtractorBulk     : env.VITE_APPWRITE_FUNCTION_PDF_PAGE_EXTRACTOR_BULK_ID || 'pdf-page-extractor-bulk',
  pdfPageNumberCustomizer  : env.VITE_APPWRITE_FUNCTION_PDF_PAGE_NUMBER_CUSTOMIZER_ID || 'pdf-page-number-customizer',
  pdfPageNumbers           : env.VITE_APPWRITE_FUNCTION_PDF_PAGE_NUMBERS_ID || 'pdf-page-numbers',
  pdfPortfolioCreator      : env.VITE_APPWRITE_FUNCTION_PDF_PORTFOLIO_CREATOR_ID || 'pdf-portfolio-creator',
  pdfProtect               : env.VITE_APPWRITE_FUNCTION_PDF_PROTECT_ID || 'pdf-protect',
  pdfRedact                : env.VITE_APPWRITE_FUNCTION_PDF_REDACT_ID || 'pdf-redact',
  pdfReorderPages          : env.VITE_APPWRITE_FUNCTION_PDF_REORDER_PAGES_ID || 'pdf-reorder-pages',
  pdfRepair                : env.VITE_APPWRITE_FUNCTION_PDF_REPAIR_ID || 'pdf-repair',
  pdfResize                : env.VITE_APPWRITE_FUNCTION_PDF_RESIZE_ID || 'pdf-resize',
  pdfRotate                : env.VITE_APPWRITE_FUNCTION_PDF_ROTATE_ID || 'pdf-rotate',
  pdfSign                  : env.VITE_APPWRITE_FUNCTION_PDF_SIGN_ID || 'pdf-sign',
  pdfSplitter              : env.VITE_APPWRITE_FUNCTION_PDF_SPLITTER_ID || 'pdf-splitter',
  pdfThumbnail             : env.VITE_APPWRITE_FUNCTION_PDF_THUMBNAIL_ID || 'pdf-thumbnail',
  pdfToExcel               : env.VITE_APPWRITE_FUNCTION_PDF_TO_EXCEL_ID || 'pdf-to-excel',
  pdfToHtml                : env.VITE_APPWRITE_FUNCTION_PDF_TO_HTML_ID || 'pdf-to-html',
  pdfToJpg                 : env.VITE_APPWRITE_FUNCTION_PDF_TO_JPG_ID || 'pdf-to-jpg',
  pdfToPowerpoint          : env.VITE_APPWRITE_FUNCTION_PDF_TO_POWERPOINT_ID || 'pdf-to-powerpoint',
  pdfToText                : env.VITE_APPWRITE_FUNCTION_PDF_TO_TEXT_ID || 'pdf-to-text',
  pdfToWord                : env.VITE_APPWRITE_FUNCTION_PDF_TO_WORD_ID || 'pdf-to-word',
  pdfUnlock                : env.VITE_APPWRITE_FUNCTION_PDF_UNLOCK_ID || 'pdf-unlock',
  pdfWatermark             : env.VITE_APPWRITE_FUNCTION_PDF_WATERMARK_ID || 'pdf-watermark',
  pdfWordCount             : env.VITE_APPWRITE_FUNCTION_PDF_WORD_COUNT_ID || 'pdf-word-count',
  powerpointToPdf          : env.VITE_APPWRITE_FUNCTION_POWERPOINT_TO_PDF_ID || 'powerpoint-to-pdf',
  removeAudio              : env.VITE_APPWRITE_FUNCTION_REMOVE_AUDIO_ID || 'remove-audio',
  ringtoneMaker            : env.VITE_APPWRITE_FUNCTION_RINGTONE_MAKER_ID || 'ringtone-maker',
  rotateImage              : env.VITE_APPWRITE_FUNCTION_ROTATE_IMAGE_ID || 'rotate-image',
  rotateVideo              : env.VITE_APPWRITE_FUNCTION_ROTATE_VIDEO_ID || 'rotate-video',
  sharpenImage             : env.VITE_APPWRITE_FUNCTION_SHARPEN_IMAGE_ID || 'sharpen-image',
  silenceRemover           : env.VITE_APPWRITE_FUNCTION_SILENCE_REMOVER_ID || 'silence-remover',
  speedChangerVideo        : env.VITE_APPWRITE_FUNCTION_SPEED_CHANGER_VIDEO_ID || 'speed-changer-video',
  textCaseConverter        : env.VITE_APPWRITE_FUNCTION_TEXT_CASE_CONVERTER_ID || 'text-case-converter',
  trimAudio                : env.VITE_APPWRITE_FUNCTION_TRIM_AUDIO_ID || 'trim-audio',
  videoCompressor          : env.VITE_APPWRITE_FUNCTION_VIDEO_COMPRESSOR_ID || 'video-compressor',
  videoTrimmer             : env.VITE_APPWRITE_FUNCTION_VIDEO_TRIMMER_ID || 'video-trimmer',
  volumeBooster            : env.VITE_APPWRITE_FUNCTION_VOLUME_BOOSTER_ID || 'volume-booster',
  watermarkImage           : env.VITE_APPWRITE_FUNCTION_WATERMARK_IMAGE_ID || 'watermark-image',
  wavConverter             : env.VITE_APPWRITE_FUNCTION_WAV_CONVERTER_ID || 'wav-converter',
  webmConverter            : env.VITE_APPWRITE_FUNCTION_WEBM_CONVERTER_ID || 'webm-converter',
  wordCounter              : env.VITE_APPWRITE_FUNCTION_WORD_COUNTER_ID || 'word-counter',
  wordToPdf                : env.VITE_APPWRITE_FUNCTION_WORD_TO_PDF_ID || 'word-to-pdf',
};

const primaryEndpoint = env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const secondaryEndpoint = 'https://cloud.appwrite.io/v1';

export const client = new Client().setEndpoint(primaryEndpoint).setProject(projectId);
const fallbackClient = new Client().setEndpoint(secondaryEndpoint).setProject(projectId);

// Restore a persisted session so subsequent account.get() calls include the
// X-Appwrite-Session header even after a page reload. This bypasses both the
// third-party cookie problem AND the X-Fallback-Cookies mechanism.
const SESSION_STORAGE_KEY = 'qofeno_session_secret';
if (typeof window !== 'undefined') {
  const persisted = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (persisted) {
    try {
      if (persisted.startsWith('ey')) {
        client.setJWT(persisted);
        fallbackClient.setJWT(persisted);
      } else {
        client.setSession(persisted);
        fallbackClient.setSession(persisted);
      }
    } catch {}
  }
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const fallbackStorage = new Storage(fallbackClient);
export const functions = new Functions(client);
export const fallbackFunctions = new Functions(fallbackClient);
export const realtime = new Realtime(client);

export function persistSession(secret: string) {
  if (!secret) return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, secret);
  try {
    if (secret.startsWith('ey')) {
      client.setJWT(secret);
      fallbackClient.setJWT(secret);
    } else {
      client.setSession(secret);
      fallbackClient.setSession(secret);
    }
  } catch {}
}

export function clearPersistedSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  window.localStorage.removeItem('qofeno_cached_user');
  try {
    client.setSession('');
    fallbackClient.setSession('');
  } catch {}
}

export function isAppwriteConfigured() {
  return Boolean(primaryEndpoint && projectId);
}

export function resolveGroupedFunctionId(toolSlug: string, category?: string): string {
  const slug = (toolSlug || '').toLowerCase();
  const cat = (category || '').toLowerCase();

  // 1. Security & Web
  if (slug.includes('password') || slug.includes('qr') || slug.includes('barcode') || slug.includes('encrypt') || slug.includes('decrypt') || slug.includes('security') || cat.includes('security')) {
    return 'qofeno-security';
  }

  // 2. Developer Tools
  if (slug.includes('json') || slug.includes('base64') || slug.includes('xml') || slug.includes('yaml') || slug.includes('sql') || slug.includes('formatter') || slug.includes('minifier') || slug.includes('jwt') || slug.includes('uuid') || slug.includes('hash') || cat.includes('developer')) {
    return 'qofeno-developer';
  }

  // 3. Text Tools
  if (slug.includes('word-counter') || slug.includes('character-counter') || slug.includes('paragraph-counter') || slug.includes('text') || slug.includes('syllable') || slug.includes('readability') || slug.includes('diff') || cat.includes('text')) {
    return 'qofeno-text';
  }

  // 4. Data Tools
  if (slug.includes('csv') || slug.includes('xlsx') || slug.includes('xls') || slug.includes('data') || slug.includes('chart') || slug.includes('table') || cat.includes('data')) {
    return 'qofeno-data';
  }

  // 5. Image Tools
  if (slug.includes('image') || slug.match(/(jpg|png|webp|avif|heic|bmp|tiff|svg|ico|raw|psd|resize|crop-image|blur-image|sharpen-image|brightness|contrast|flip-image|rotate-image|watermark-image)/) || cat.includes('image')) {
    return 'qofeno-image';
  }

  // 6. Video Tools
  if (slug.includes('video') || slug.match(/(mp4|mov|avi|webm|mkv|flv|wmv|3gp|trim-video|crop-video|compress-video|merge-video|rotate-video|flip-video|extract-audio|remove-audio|speed-changer-video|reverse-video|loop-video|gif-maker-video|thumbnail-extractor)/) || cat.includes('video')) {
    return 'qofeno-video';
  }

  // 7. Audio Tools
  if (slug.includes('audio') || slug.match(/(mp3|wav|ogg|flac|aac|opus|wma|aiff|amr|trim-audio|merge-audio|volume-booster|change-audio|fade-in-audio|fade-out-audio|silence-remover|audio-reverser|ringtone-maker|bass-booster|background-noise-remover)/) || cat.includes('audio')) {
    return 'qofeno-audio';
  }

  // 8. PDF Tools (Default)
  return 'qofeno-pdf';
}

async function pollExecutionResult(
  toolSlug: string,
  startTime: number,
  executionId?: string,
  onProgress?: (progress: number, message: string) => void
): Promise<any> {
  const maxWaitMs = 300000; // 5 minutes polling window
  const pollIntervalMs = 1500;
  const ep = (env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1').replace(/\/$/, '');
  const pid = env.VITE_APPWRITE_PROJECT_ID || '69c58725000ef2b43f18';

  let pollCount = 0;

  while (Date.now() - startTime < maxWaitMs) {
    pollCount++;
    await new Promise((r) => setTimeout(r, pollIntervalMs));

    // 1. Poll tool_execution_logs for live progress messages from backend
    if (onProgress && executionId) {
      try {
        const logDocs = await databases.listDocuments(DATABASE_ID, 'tool_execution_logs', [
          Query.equal('execution_id', executionId),
          Query.orderDesc('$createdAt'),
          Query.limit(1)
        ]);
        if (logDocs.documents.length > 0) {
          const latestLog = logDocs.documents[0];
          if (latestLog.message) {
            onProgress(latestLog.progress || 88, latestLog.message);
          }
        }
      } catch {}
    }

    // 2. Poll tool_executions for final completion document
    try {
      let docs = await databases.listDocuments(DATABASE_ID, 'tool_executions', [
        Query.equal('tool_slug', toolSlug),
        Query.orderDesc('$createdAt'),
        Query.limit(5)
      ]);

      if (docs.documents.length === 0) {
        docs = await databases.listDocuments(DATABASE_ID, 'tool_executions', [
          Query.orderDesc('$createdAt'),
          Query.limit(5)
        ]);
      }

      if (docs.documents.length > 0) {
        for (const latest of docs.documents) {
          const docTime = new Date(latest.$createdAt).getTime();
          if (docTime >= startTime - 10000) {
            if (latest.status === 'completed' || latest.download_url) {
              if (onProgress) onProgress(100, 'Processing complete!');
              return {
                success: true,
                output_filename: latest.output_filename || `${toolSlug}_result`,
                download_url: latest.download_url || `${ep}/storage/buckets/tool_outputs/files/${latest.output_file_id}/download?project=${pid}`,
                file_id: latest.output_file_id,
              };
            } else if (latest.status === 'failed') {
              const errObj = new Error(`Tool Execution Failed [${toolSlug}]: ${latest.error_message || 'Unknown error'}`);
              captureException(errObj, { toolSlug, error_message: latest.error_message });
              return {
                success: false,
                error: latest.error_message || 'Processing failed on the server. Please check options and try again.'
              };
            }
          }
        }
      }
    } catch (e) {
      console.warn('Polling tool_executions document error:', e);
    }

    if (onProgress && pollCount % 4 === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      onProgress(Math.min(96, 85 + Math.floor(pollCount / 2)), `Background task running on server (${elapsed}s elapsed)...`);
    }
  }

  const timeoutErr = new Error(`Tool Processing Timeout [${toolSlug}]: Processing timed out on server (>5 min).`);
  captureException(timeoutErr, { toolSlug, waitDurationMs: Date.now() - startTime });

  return { success: false, error: 'Processing timed out on server. Please try again with a smaller file or different options.' };
}

export async function executeJsonFunction(
  functionId: string,
  payload: Record<string, unknown>,
  onProgress?: (progress: number, message: string) => void
) {
  const validFunctionIds = [
    'qofeno-pdf', 'qofeno-image', 'qofeno-video', 'qofeno-audio',
    'qofeno-text', 'qofeno-developer', 'qofeno-data', 'qofeno-security',
    'track-event', 'auth-webhook', 'payment-webhook', 'create-download-link', 'contact-form'
  ];

  let targetId = functionId;
  if (!targetId || !validFunctionIds.includes(targetId)) {
    const toolSlug = String(payload.tool || targetId || '');
    targetId = resolveGroupedFunctionId(toolSlug);
  }

  const toolSlug = String(payload.tool || targetId);
  const executionId = String(payload.execution_id || payload.executionId || '');
  const startTime = Date.now();

  try {
    const execution = await functions.createExecution(targetId, JSON.stringify(payload), false);
    
    if (execution.status === 'failed') {
      const raw = execution.responseBody || '';
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.error) return parsed;
        } catch {}
      }

      const serverErr = String(execution.errors || 'Function execution failed on server.');
      if (serverErr.includes('timed out') || serverErr.includes('exceed 30 seconds') || serverErr.includes('408')) {
        console.warn('Appwrite Cloud function timed out (>30s). Launching background async execution & polling DB...');
        if (onProgress) onProgress(85, 'Function execution extended. Polling background result...');
        try {
          await functions.createExecution(targetId, JSON.stringify(payload), true);
        } catch (asyncErr) {
          console.warn('Async execution launch warning:', asyncErr);
        }
        return await pollExecutionResult(toolSlug, startTime, executionId, onProgress);
      }

      const cleanMsg = (serverErr.includes('general_unknown') || serverErr.includes('Error Code: 500') || serverErr.includes('Function execution failed on server.'))
        ? 'Processing encountered a temporary server error. Please check your options and try again.'
        : serverErr;
      return { success: false, error: cleanMsg };
    }

    const raw = execution.responseBody || '{}';
    if (typeof raw !== 'string') {
      return raw;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return { success: false, error: raw };
    }
  } catch (err1: any) {
    const msg1 = String(err1?.message || '');

    if (msg1.includes('timed out') || msg1.includes('exceed 30 seconds') || msg1.includes('408')) {
      console.warn('Synchronous execution timed out (>30s). Triggering background async execution and polling...');
      if (onProgress) onProgress(85, 'Server connection timed out (>30s). Switching to live background polling...');
      try {
        await functions.createExecution(targetId, JSON.stringify(payload), true);
      } catch (asyncErr) {
        console.warn('Async execution launch warning:', asyncErr);
      }
      return await pollExecutionResult(toolSlug, startTime, executionId, onProgress);
    }

    console.warn(`Primary Appwrite endpoint failed (${msg1}), retrying with fallback endpoint...`);
    try {
      const execution2 = await fallbackFunctions.createExecution(targetId, JSON.stringify(payload), false);
      if (execution2.status === 'failed') {
        const serverErr = String(execution2.errors || 'Function execution failed on server.');
        if (serverErr.includes('timed out') || serverErr.includes('exceed 30 seconds') || serverErr.includes('408')) {
          console.warn('Fallback execution timed out. Launching async execution and polling DB...');
          if (onProgress) onProgress(85, 'Fallback connection extended. Polling background result...');
          try {
            await fallbackFunctions.createExecution(targetId, JSON.stringify(payload), true);
          } catch (asyncErr) {
            console.warn('Async execution launch warning:', asyncErr);
          }
          return await pollExecutionResult(toolSlug, startTime, executionId, onProgress);
        }
        return { success: false, error: serverErr };
      }

      const raw2 = execution2.responseBody || '{}';
      if (typeof raw2 !== 'string') {
        return raw2;
      }
      try {
        return JSON.parse(raw2);
      } catch {
        return { success: false, error: raw2 };
      }
    } catch (err2: any) {
      const msg2 = String(err2?.message || '');

      if (msg2.includes('timed out') || msg2.includes('exceed 30 seconds') || msg2.includes('408')) {
        console.warn('Fallback endpoint timed out. Triggering background async execution and polling...');
        if (onProgress) onProgress(85, 'Fallback endpoint timed out. Switching to live background polling...');
        try {
          await fallbackFunctions.createExecution(targetId, JSON.stringify(payload), true);
        } catch (asyncErr) {
          console.warn('Async execution launch warning:', asyncErr);
        }
        return await pollExecutionResult(toolSlug, startTime, executionId, onProgress);
      }

      console.error('All Appwrite endpoints failed:', err2);
      return {
        success: false,
        error: err2?.message || err1?.message || 'Processing server is currently unreachable. Please try again.'
      };
    }
  }
}







export async function trackEvent(eventType: 'view' | 'like' | 'unlike' | 'recent', toolSlug: string, userId?: string) {
  if (!FUNCTION_IDS.trackEvent) return null;
  try {
    return await executeJsonFunction(FUNCTION_IDS.trackEvent, {
      event_type: eventType,
      tool_slug: toolSlug,
      user_id: userId || null,
    });
  } catch {
    return null;
  }
}

export async function runJsonFormatter(input: string, action: 'format' | 'minify' | 'validate' = 'format') {
  return executeJsonFunction('qofeno-developer', { tool: 'json-formatter', json: input, action });
}

export async function runWordCounter(text: string) {
  return executeJsonFunction('qofeno-text', { tool: 'word-counter', text });
}

export async function runBase64Encoder(input: string, action: 'encode' | 'decode' = 'encode') {
  return executeJsonFunction('qofeno-developer', { tool: 'base64-encoder', text: input, action });
}

export async function submitContactForm(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  if (!FUNCTION_IDS.contactForm) {
    throw new Error('Contact form function is not configured');
  }
  return executeJsonFunction(FUNCTION_IDS.contactForm, payload);
}
