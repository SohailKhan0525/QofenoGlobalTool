import fs from 'fs';
import path from 'path';

const CATEGORY_MAP = {
  // PDF
  'PDF_COMPRESSOR': 'qofeno-pdf',
  'PDF_MERGER': 'qofeno-pdf',
  'PDF_SPLITTER': 'qofeno-pdf',
  'PDF_ROTATE': 'qofeno-pdf',
  'PDF_TO_JPG': 'qofeno-pdf',
  'JPG_TO_PDF': 'qofeno-pdf',
  'PDF_PAGE_NUMBERS': 'qofeno-pdf',
  'PDF_TO_TEXT': 'qofeno-pdf',
  'PDF_WORD_COUNT': 'qofeno-pdf',
  'PDF_METADATA_VIEWER': 'qofeno-pdf',
  'BATCH_COMPRESS_PDFS': 'qofeno-pdf',
  'BATCH_CONVERT_PDFS': 'qofeno-pdf',
  'BATCH_MERGE_PDFS': 'qofeno-pdf',
  'PDF_TO_WORD': 'qofeno-pdf',
  'PDF_WATERMARK': 'qofeno-pdf',
  'PDF_PROTECT': 'qofeno-pdf',
  'PDF_OCR': 'qofeno-pdf',
  'PDF_UNLOCK': 'qofeno-pdf',
  'PDF_FLATTEN': 'qofeno-pdf',
  'PDF_THUMBNAIL': 'qofeno-pdf',
  'PDF_REPAIR': 'qofeno-pdf',
  'PDF_REDACT': 'qofeno-pdf',
  'PDF_SIGN': 'qofeno-pdf',
  'PDF_CROP': 'qofeno-pdf',
  'PDF_COMPARE': 'qofeno-pdf',
  'PDF_TO_EXCEL': 'qofeno-pdf',
  'PDF_TO_POWERPOINT': 'qofeno-pdf',
  'PDF_TO_HTML': 'qofeno-pdf',
  'WORD_TO_PDF': 'qofeno-pdf',
  'EXCEL_TO_PDF': 'qofeno-pdf',
  'POWERPOINT_TO_PDF': 'qofeno-pdf',
  'PDF_BOOKLET_CREATOR': 'qofeno-pdf',
  'PDF_COLOR_CONVERTER': 'qofeno-pdf',
  'PDF_DELETE_PAGES': 'qofeno-pdf',
  'PDF_EXTRACT_PAGES': 'qofeno-pdf',
  'PDF_FORM_CREATOR': 'qofeno-pdf',
  'PDF_FORM_FILLER': 'qofeno-pdf',
  'PDF_GRAYSCALE': 'qofeno-pdf',
  'PDF_HEADER_FOOTER': 'qofeno-pdf',
  'PDF_METADATA_EDITOR': 'qofeno-pdf',
  'PDF_PAGE_EXTRACTOR_BULK': 'qofeno-pdf',
  'PDF_PAGE_NUMBER_CUSTOMIZER': 'qofeno-pdf',
  'PDF_PORTFOLIO_CREATOR': 'qofeno-pdf',
  'PDF_REORDER_PAGES': 'qofeno-pdf',
  'PDF_RESIZE': 'qofeno-pdf',

  // Image
  'IMAGE_RESIZER': 'qofeno-image',
  'IMAGE_COMPRESSOR': 'qofeno-image',
  'IMAGE_CONVERTER': 'qofeno-image',
  'IMAGE_BG_REMOVER': 'qofeno-image',
  'IMAGE_MANIPULATOR': 'qofeno-image',

  // Video
  'VIDEO_COMPRESSOR': 'qofeno-video',
  'VIDEO_TRIMMER': 'qofeno-video',
  'VIDEO_MANIPULATOR': 'qofeno-video',

  // Audio
  'AUDIO_MANIPULATOR': 'qofeno-audio',
  'AAC_CONVERTER': 'qofeno-audio',
  'AUDIO_COMPRESSOR': 'qofeno-audio',
  'AUDIO_METADATA_VIEWER': 'qofeno-audio',
  'AUDIO_REVERSER': 'qofeno-audio',
  'AVI_CONVERTER': 'qofeno-audio',
  'BACKGROUND_NOISE_REMOVER': 'qofeno-audio',
  'BASS_BOOSTER': 'qofeno-audio',
  'CHANGE_PITCH': 'qofeno-audio',
  'CHANGE_SPEED': 'qofeno-audio',
  'CONTRAST_ADJUST': 'qofeno-audio',
  'EXTRACT_AUDIO': 'qofeno-audio',
  'FADE_IN': 'qofeno-audio',
  'FADE_OUT': 'qofeno-audio',
  'FLAC_CONVERTER': 'qofeno-audio',
  'GIF_MAKER_VIDEO': 'qofeno-audio',
  'MERGE_AUDIO': 'qofeno-audio',
  'MERGE_VIDEOS': 'qofeno-audio',
  'MOV_CONVERTER': 'qofeno-audio',
  'MP3_CONVERTER': 'qofeno-audio',
  'MP4_CONVERTER': 'qofeno-audio',
  'OGG_CONVERTER': 'qofeno-audio',
  'REMOVE_AUDIO': 'qofeno-audio',
  'RINGTONE_MAKER': 'qofeno-audio',
  'SILENCE_REMOVER': 'qofeno-audio',
  'SPEED_CHANGER_VIDEO': 'qofeno-audio',
  'TRIM_AUDIO': 'qofeno-audio',
  'VOLUME_BOOSTER': 'qofeno-audio',
  'WAV_CONVERTER': 'qofeno-audio',
  'WEBM_CONVERTER': 'qofeno-audio',

  // Developer / Text / Data / Security (We map these individually as they are dynamically resolved or have fallback helpers)
  'JSON_FORMATTER': 'qofeno-developer',
  'WORD_COUNTER': 'qofeno-text',
  'BASE64_ENCODER': 'qofeno-developer',
  'TEXT_CASE_CONVERTER': 'qofeno-text',
  
  // Platform / Webhooks (Recreated with stable ids)
  'TRACK_EVENT': 'track-event',
  'CONTACT_FORM': 'contact-form',
  'CREATE_DOWNLOAD_LINK': 'create-download-link',
  'PAYMENT_WEBHOOK': 'payment-webhook',
  'AUTH_WEBHOOK': 'auth-webhook',
  'PAYPAL_WEBHOOK': 'paypal-webhook',
  'NEW_TOOL_NOTIFIER': 'new-tool-notifier',
  'WHATS_NEW_NOTIFIER': 'whats-new-notifier',
  'AUTO_PUBLISH_BLOG': 'auto-publish-blog',
};

const ENV_FILES = ['.env', '.env.server'];

function updateEnvContent(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const updatedLines = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^(VITE_APPWRITE_FUNCTION_|APPWRITE_FUNCTION_)([A-Z0-9_]+)_ID=(.*)$/);
      if (match) {
        const prefix = match[1] || '';
        const key = match[2];
        const mappedValue = CATEGORY_MAP[key];

        if (mappedValue) {
          line = `${prefix}${key}_ID=${mappedValue}`;
        } else {
          // If it is any other individual tool slug, map it to the corresponding category!
          const slug = key.toLowerCase().replace(/_/g, '-');
          let category = 'qofeno-security';
          
          if (slug.includes('pdf') || slug.includes('word') || slug.includes('excel') || slug.includes('powerpoint') || slug.includes('csv') || slug.includes('txt') || slug.includes('epub') || slug.includes('html')) {
            category = 'qofeno-pdf';
          } else if (slug.includes('video') || slug.match(/(mp4|mov|avi|webm|mkv|gif-maker)/)) {
            category = 'qofeno-video';
          } else if (slug.includes('image') || slug.match(/(jpg|png|webp|avif|bmp|gif|svg|ico|heic|tiff)/)) {
            category = 'qofeno-image';
          } else if (slug.includes('audio') || slug.match(/(mp3|wav|ogg|flac|aac|volume|pitch|bass|silence|fade|ringtone|m4a|wma|amr|vocal|tempo|bpm|reverb|echo)/)) {
            category = 'qofeno-audio';
          } else if (slug.includes('json') || slug.includes('xml') || slug.includes('yaml') || slug.includes('base64') || slug.includes('developer') || slug.includes('prettier') || slug.includes('minify') || slug.includes('regex') || slug.includes('sql') || slug.includes('uuid') || slug.includes('cron') || slug.includes('user-agent')) {
            category = 'qofeno-developer';
          } else if (slug.includes('text') || slug.includes('word') || slug.includes('case') || slug.includes('markdown') || slug.includes('diff') || slug.includes('spell') || slug.includes('translate') || slug.includes('lorem')) {
            category = 'qofeno-text';
          } else if (slug.includes('data') || slug.includes('csv') || slug.includes('tsv') || slug.includes('xlsx') || slug.includes('chart') || slug.includes('graph')) {
            category = 'qofeno-data';
          } else if (slug.includes('security') || slug.includes('password') || slug.includes('bcrypt') || slug.includes('md5') || slug.includes('sha') || slug.includes('encrypt') || slug.includes('decrypt') || slug.includes('cipher') || slug.includes('hash') || slug.includes('barcode') || slug.includes('qr')) {
            category = 'qofeno-security';
          }
          
          line = `${prefix}${key}_ID=${category}`;
        }
      }
    }
    updatedLines.push(line);
  }

  fs.writeFileSync(filePath, updatedLines.join('\n'));
  console.log(`✓ Updated ${filePath}`);
}

function main() {
  for (const file of ENV_FILES) {
    updateEnvContent(path.resolve(file));
  }
}

main();
