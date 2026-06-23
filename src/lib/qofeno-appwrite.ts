import { Account, Client, Databases, Functions, Realtime, Storage } from 'appwrite';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
const endpoint = env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = env.VITE_APPWRITE_PROJECT_ID || '69c58725000ef2b43f18';

export const DATABASE_ID = env.VITE_APPWRITE_DATABASE_ID || 'qofeno_db';

export const FUNCTION_IDS = {
  // Developer / Text Tools
  jsonFormatter:        env.VITE_APPWRITE_FUNCTION_JSON_FORMATTER_ID,
  wordCounter:          env.VITE_APPWRITE_FUNCTION_WORD_COUNTER_ID,
  base64Encoder:        env.VITE_APPWRITE_FUNCTION_BASE64_ENCODER_ID,
  textCaseConverter:    env.VITE_APPWRITE_FUNCTION_TEXT_CASE_CONVERTER_ID,

  // Platform
  trackEvent:           env.VITE_APPWRITE_FUNCTION_TRACK_EVENT_ID,
  authWebhook:          env.VITE_APPWRITE_FUNCTION_AUTH_WEBHOOK_ID,
  paymentWebhook:       env.VITE_APPWRITE_FUNCTION_PAYMENT_WEBHOOK_ID,
  createDownloadLink:   env.VITE_APPWRITE_FUNCTION_CREATE_DOWNLOAD_LINK_ID,
  contactForm:          env.VITE_APPWRITE_FUNCTION_CONTACT_FORM_ID,

  // FREE PDF Tools
  pdfCompressor:        env.VITE_APPWRITE_FUNCTION_PDF_COMPRESSOR_ID,
  pdfMerger:            env.VITE_APPWRITE_FUNCTION_PDF_MERGER_ID,
  pdfSplitter:          env.VITE_APPWRITE_FUNCTION_PDF_SPLITTER_ID,
  pdfRotate:            env.VITE_APPWRITE_FUNCTION_PDF_ROTATE_ID,
  pdfToJpg:             env.VITE_APPWRITE_FUNCTION_PDF_TO_JPG_ID,
  jpgToPdf:             env.VITE_APPWRITE_FUNCTION_JPG_TO_PDF_ID,
  pdfPageNumbers:       env.VITE_APPWRITE_FUNCTION_PDF_PAGE_NUMBERS_ID,
  pdfToText:            env.VITE_APPWRITE_FUNCTION_PDF_TO_TEXT_ID,
  pdfWordCount:         env.VITE_APPWRITE_FUNCTION_PDF_WORD_COUNT_ID,
  pdfMetadataViewer:    env.VITE_APPWRITE_FUNCTION_PDF_METADATA_VIEWER_ID,

  // PRO PDF Tools
  pdfToWord:            env.VITE_APPWRITE_FUNCTION_PDF_TO_WORD_ID,
  pdfWatermark:         env.VITE_APPWRITE_FUNCTION_PDF_WATERMARK_ID,
  pdfProtect:           env.VITE_APPWRITE_FUNCTION_PDF_PROTECT_ID,
  pdfOcr:               env.VITE_APPWRITE_FUNCTION_PDF_OCR_ID,
  pdfUnlock:            env.VITE_APPWRITE_FUNCTION_PDF_UNLOCK_ID,
  pdfFlatten:           env.VITE_APPWRITE_FUNCTION_PDF_FLATTEN_ID,
  pdfThumbnail:         env.VITE_APPWRITE_FUNCTION_PDF_THUMBNAIL_ID,
  pdfRepair:            env.VITE_APPWRITE_FUNCTION_PDF_REPAIR_ID,
  pdfRedact:            env.VITE_APPWRITE_FUNCTION_PDF_REDACT_ID,
  pdfSign:              env.VITE_APPWRITE_FUNCTION_PDF_SIGN_ID,
  pdfCrop:              env.VITE_APPWRITE_FUNCTION_PDF_CROP_ID,
  pdfCompare:           env.VITE_APPWRITE_FUNCTION_PDF_COMPARE_ID,
  pdfToExcel:           env.VITE_APPWRITE_FUNCTION_PDF_TO_EXCEL_ID,
  pdfToPowerpoint:      env.VITE_APPWRITE_FUNCTION_PDF_TO_POWERPOINT_ID,
  pdfToHtml:            env.VITE_APPWRITE_FUNCTION_PDF_TO_HTML_ID,
  wordToPdf:            env.VITE_APPWRITE_FUNCTION_WORD_TO_PDF_ID,
  excelToPdf:           env.VITE_APPWRITE_FUNCTION_EXCEL_TO_PDF_ID,
  powerpointToPdf:      env.VITE_APPWRITE_FUNCTION_POWERPOINT_TO_PDF_ID,

  // Image Tools
  imageResizer:         env.VITE_APPWRITE_FUNCTION_IMAGE_RESIZER_ID,
  imageCompressor:      env.VITE_APPWRITE_FUNCTION_IMAGE_COMPRESSOR_ID,
  imageConverter:       env.VITE_APPWRITE_FUNCTION_IMAGE_CONVERTER_ID,
  imageBgRemover:       env.VITE_APPWRITE_FUNCTION_IMAGE_BG_REMOVER_ID,
  imageManipulator:     env.VITE_APPWRITE_FUNCTION_IMAGE_MANIPULATOR_ID,

  // Video Tools
  videoCompressor:      env.VITE_APPWRITE_FUNCTION_VIDEO_COMPRESSOR_ID,
  videoTrimmer:         env.VITE_APPWRITE_FUNCTION_VIDEO_TRIMMER_ID,
  videoManipulator:     env.VITE_APPWRITE_FUNCTION_VIDEO_MANIPULATOR_ID,

  // Audio Tools
  audioManipulator:     env.VITE_APPWRITE_FUNCTION_AUDIO_MANIPULATOR_ID,
};

const client = new Client().setEndpoint(endpoint).setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
export const realtime = new Realtime(client);

export function isAppwriteConfigured() {
  return Boolean(endpoint && projectId);
}

export async function executeJsonFunction(functionId: string, payload: Record<string, unknown>) {
  if (!functionId) {
    throw new Error('Function not configured yet. Please deploy the Appwrite function and add the ID to .env.');
  }
  const execution = await functions.createExecution(functionId, JSON.stringify(payload), false);
  const raw = execution.responseBody || '{}';
  if (typeof raw !== 'string') {
    return raw;
  }
  return JSON.parse(raw);
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
  return executeJsonFunction(FUNCTION_IDS.jsonFormatter, { json: input, action });
}

export async function runWordCounter(text: string) {
  return executeJsonFunction(FUNCTION_IDS.wordCounter, { text });
}

export async function runBase64Encoder(input: string, action: 'encode' | 'decode' = 'encode') {
  if (!FUNCTION_IDS.base64Encoder) {
    throw new Error('Base64 encoder function is not configured');
  }
  return executeJsonFunction(FUNCTION_IDS.base64Encoder, { text: input, action });
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
