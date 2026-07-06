import { Account, Client, Databases, Functions, Realtime, Storage } from 'appwrite';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
const endpoint = env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
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
