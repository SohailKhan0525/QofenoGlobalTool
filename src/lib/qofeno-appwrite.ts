import { Account, Client, Databases, Functions, Realtime, Storage } from 'appwrite';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
const endpoint = env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = env.VITE_APPWRITE_PROJECT_ID || '69c58725000ef2b43f18';

export const DATABASE_ID = env.VITE_APPWRITE_DATABASE_ID || 'qofeno_db';

export const FUNCTION_IDS = {
  // Developer / Text Tools
  jsonFormatter:        env.VITE_APPWRITE_FUNCTION_JSON_FORMATTER_ID      || '2217055e890645a5af054eb1d6186efe',
  wordCounter:          env.VITE_APPWRITE_FUNCTION_WORD_COUNTER_ID         || '4291a710a39643dca3c0f28615496583',
  base64Encoder:        env.VITE_APPWRITE_FUNCTION_BASE64_ENCODER_ID       || 'e63948affa5e460085fc9fc8b2a14dde',
  textCaseConverter:    env.VITE_APPWRITE_FUNCTION_TEXT_CASE_CONVERTER_ID  || '8be86de4f76b44d59fbfba912b749482',

  // Platform
  trackEvent:           env.VITE_APPWRITE_FUNCTION_TRACK_EVENT_ID          || '2ae3ea71599748069626086a6ffcc629',
  authWebhook:          env.VITE_APPWRITE_FUNCTION_AUTH_WEBHOOK_ID         || '8d7fa5f13e644837ab789e8753b0ef48',
  paymentWebhook:       env.VITE_APPWRITE_FUNCTION_PAYMENT_WEBHOOK_ID      || '4bc2da1ea61b4ff896ebecada97afa75',
  createDownloadLink:   env.VITE_APPWRITE_FUNCTION_CREATE_DOWNLOAD_LINK_ID || 'c461e7073a8f4ad2b177132d9864dcec',
  contactForm:          env.VITE_APPWRITE_FUNCTION_CONTACT_FORM_ID         || 'c5ff2e4961c24afdaa2f4dba87b2ddfe',

  // FREE PDF Tools
  pdfCompressor:        env.VITE_APPWRITE_FUNCTION_PDF_COMPRESSOR_ID       || '8e0d74d220b841bab88e1eab430a48a4',
  pdfMerger:            env.VITE_APPWRITE_FUNCTION_PDF_MERGER_ID            || '5b901944578b4f55b49f0a3a5bf92ce5',
  pdfSplitter:          env.VITE_APPWRITE_FUNCTION_PDF_SPLITTER_ID          || '6d6e586a3b104a5bba400a8c6fddb020',
  pdfRotate:            env.VITE_APPWRITE_FUNCTION_PDF_ROTATE_ID            || '',
  pdfToJpg:             env.VITE_APPWRITE_FUNCTION_PDF_TO_JPG_ID            || '',
  jpgToPdf:             env.VITE_APPWRITE_FUNCTION_JPG_TO_PDF_ID            || '',
  pdfPageNumbers:       env.VITE_APPWRITE_FUNCTION_PDF_PAGE_NUMBERS_ID      || '',
  pdfToText:            env.VITE_APPWRITE_FUNCTION_PDF_TO_TEXT_ID           || '',
  pdfWordCount:         env.VITE_APPWRITE_FUNCTION_PDF_WORD_COUNT_ID        || '',
  pdfMetadataViewer:    env.VITE_APPWRITE_FUNCTION_PDF_METADATA_VIEWER_ID   || '',

  // PRO PDF Tools
  pdfToWord:            env.VITE_APPWRITE_FUNCTION_PDF_TO_WORD_ID           || 'a6ef63d22525488890fcc6bfb2ea9b55',
  pdfWatermark:         env.VITE_APPWRITE_FUNCTION_PDF_WATERMARK_ID         || '',
  pdfProtect:           env.VITE_APPWRITE_FUNCTION_PDF_PROTECT_ID           || '',
  pdfOcr:               env.VITE_APPWRITE_FUNCTION_PDF_OCR_ID               || '',
  pdfUnlock:            env.VITE_APPWRITE_FUNCTION_PDF_UNLOCK_ID            || '',
  pdfFlatten:           env.VITE_APPWRITE_FUNCTION_PDF_FLATTEN_ID           || '',
  pdfThumbnail:         env.VITE_APPWRITE_FUNCTION_PDF_THUMBNAIL_ID         || '',
  pdfRepair:            env.VITE_APPWRITE_FUNCTION_PDF_REPAIR_ID            || '',
  pdfRedact:            env.VITE_APPWRITE_FUNCTION_PDF_REDACT_ID            || '',
  pdfSign:              env.VITE_APPWRITE_FUNCTION_PDF_SIGN_ID              || '',
  pdfCrop:              env.VITE_APPWRITE_FUNCTION_PDF_CROP_ID              || '',
  pdfCompare:           env.VITE_APPWRITE_FUNCTION_PDF_COMPARE_ID           || '',
  pdfToExcel:           env.VITE_APPWRITE_FUNCTION_PDF_TO_EXCEL_ID          || '',
  pdfToPowerpoint:      env.VITE_APPWRITE_FUNCTION_PDF_TO_POWERPOINT_ID     || '',
  pdfToHtml:            env.VITE_APPWRITE_FUNCTION_PDF_TO_HTML_ID           || '',
  wordToPdf:            env.VITE_APPWRITE_FUNCTION_WORD_TO_PDF_ID           || '',
  excelToPdf:           env.VITE_APPWRITE_FUNCTION_EXCEL_TO_PDF_ID          || '',
  powerpointToPdf:      env.VITE_APPWRITE_FUNCTION_POWERPOINT_TO_PDF_ID     || '',

  // Image Tools
  imageResizer:         env.VITE_APPWRITE_FUNCTION_IMAGE_RESIZER_ID         || '893ee730c40c45b8b65b4bf3129d2dea',
  imageCompressor:      env.VITE_APPWRITE_FUNCTION_IMAGE_COMPRESSOR_ID      || 'ac2703f31bc2480b94014fe17ae69ff0',
  imageConverter:       env.VITE_APPWRITE_FUNCTION_IMAGE_CONVERTER_ID       || 'e82741d4b61642c290ccb95909d2b1b4',
  imageBgRemover:       env.VITE_APPWRITE_FUNCTION_IMAGE_BG_REMOVER_ID      || '9e1ae1632aeb4ce789399df3c236b24f',

  // Video Tools
  videoCompressor:      env.VITE_APPWRITE_FUNCTION_VIDEO_COMPRESSOR_ID      || '9b6795e4c10643ba80954c6c6cc65f32',
  videoTrimmer:         env.VITE_APPWRITE_FUNCTION_VIDEO_TRIMMER_ID         || '94b5e417d36a4c5284618d8f70bd644b',
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
