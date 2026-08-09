import { Client, Databases, Query } from "node-appwrite";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '69c58725000ef2b43f18')
  .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);
const DATABASE_ID = process.env.DATABASE_ID || "qofeno_db";

const AZURE_PDF_TOOLS = new Set([
  "pdf-compress","pdf-to-word","pdf-to-excel","pdf-to-powerpoint",
  "pdf-to-html","pdf-to-jpg","pdf-to-png","pdf-to-webp","pdf-to-tiff",
  "pdf-to-svg","pdf-ocr","pdf-searchable","pdf-extract-tables",
  "pdf-table-to-excel","pdf-table-to-csv","pdf-linearize","pdf-repair",
  "pdf-to-grayscale","pdf-to-bw","pdf-cmyk","pdf-adjust-brightness",
  "pdf-adjust-contrast","pdf-reduce-resolution","pdf-increase-resolution",
  "word-to-pdf","excel-to-pdf","ppt-to-pdf","doc-to-pdf","odt-to-pdf",
  "rtf-to-pdf","html-to-pdf","epub-to-pdf","svg-to-pdf",
  "pdf-to-epub","pdf-to-rtf","pdf-to-odt","pdf-to-xml","pdf-to-json",
  "pdf-print-ready","pdf-add-bleed","pdf-add-cropmarks","pdf-rgb",
  "pdf-compare-images","pdf-compare-layout","pdf-flatten-form",
  "pdf-redact","pdf-extract-images","pdf-compress-images",
  "pdf-batch-compress","pdf-batch-convert","pdf-batch-ocr",
  "pdf-batch-encrypt","pdf-batch-decrypt",
]);

const AZURE_IMAGE_TOOLS = new Set([
  "image-bg-remover","image-effects","image-oil-painting","image-cartoon",
  "image-sketch","image-edge-detection","image-noise-reduction",
  "image-upscale","raw-to-jpg","heic-to-jpg","jpg-to-heic",
  "image-gif-optimizer","image-large-processing","png-to-svg",
  "image-psd-to-png","image-raw-to-jpg","image-face-crop",
  "image-duplicate-finder","image-batch-resize","image-batch-compress",
  "image-batch-convert","image-batch-watermark","image-batch-rename",
  "image-batch-optimize",
]);

const AZURE_MEDIA_TOOLS = new Set([
  // ALL video tools
  "video-trim","video-crop","video-compress","video-merge","video-split",
  "video-rotate","video-flip","video-reverse","video-loop","video-mute",
  "video-remove-audio","video-extract-audio","video-replace-audio",
  "video-speed","video-slow-motion","video-fast-motion","video-resolution",
  "video-fps","video-bitrate","video-stabilize","video-denoiser",
  "video-brightness","video-contrast","video-saturation",
  "video-color-correction","video-sharpen","video-blur-effect",
  "video-watermark","video-remove-watermark","video-add-text",
  "video-add-logo","video-add-intro","video-add-outro","video-add-music",
  "video-fade-in","video-fade-out","video-to-gif","video-frame-extractor",
  "video-thumbnail","video-metadata","video-to-mp3","video-to-wav",
  "video-to-aac","video-subtitle-embed","video-subtitle-extract",
  "video-subtitle-convert","video-hardcode-subtitles","video-chapter",
  "video-metadata-edit","video-audio-sync","video-contact-sheet",
  "video-preview","mp4-converter","mov-converter","avi-converter",
  "mkv-converter","webm-converter","flv-converter","wmv-converter",
  "mpeg-converter","m4v-converter","3gp-converter","video-to-images",
  "images-to-video","gif-to-video","video-square","video-vertical",
  "video-horizontal","video-animated-webp","video-comparison",
  "video-social-youtube","video-social-instagram","video-social-tiktok",
  "video-social-facebook","video-social-linkedin","video-joiner",
  "video-batch-convert","video-batch-compress","video-batch-trim",
  "video-batch-watermark","video-batch-split","video-batch-merge",
  "video-multi-export","video-large-processing","video-faster-encoding",
  "video-multi-audio","video-multi-subtitle","video-splitter-bulk",
  // ALL audio tools
  "audio-mp3","audio-wav","audio-aac","audio-ogg","audio-flac",
  "audio-m4a","audio-aiff","audio-wma","audio-opus","audio-amr",
  "audio-trim","audio-cut","audio-merge","audio-split","audio-compress",
  "audio-volume","audio-normalize","audio-speed","audio-pitch",
  "audio-fade-in","audio-fade-out","audio-silence-remover","audio-reverse",
  "audio-bass-booster","audio-treble-booster","audio-equalizer",
  "audio-noise-reduction","audio-echo-removal","audio-reverb",
  "audio-voice-changer","audio-mono","audio-stereo","audio-channel-mixer",
  "audio-balance","audio-metadata-edit","audio-cover-art",
  "audio-batch-tags","audio-extract-from-video","audio-replace-in-video",
  "audio-ringtone","audio-waveform","audio-frequency","audio-spectrogram",
  "audio-loudness","audio-bpm","audio-key-detector","audio-vocal-isolation",
  "audio-instrument-remove","audio-karaoke","audio-comparison",
  "audio-watermark","audio-enhancer","audio-podcast-cleaner","audio-joiner",
  "audio-batch-convert","audio-batch-compress","audio-batch-trim",
  "audio-batch-cut","audio-batch-join","audio-batch-normalize",
  "audio-batch-volume","audio-batch-metadata","audio-multi-export",
  "audio-large-processing","audio-splitter-bulk",
]);

async function ensureAttributes() {
  const attrs = [
    { key: "free_backend", size: 255, defaultVal: "appwrite" },
    { key: "pro_backend", size: 255, defaultVal: "appwrite" },
    { key: "azure_container", size: 255, defaultVal: null },
    { key: "azure_endpoint", size: 255, defaultVal: null }
  ];

  for (const a of attrs) {
    try {
      await db.createStringAttribute(DATABASE_ID, "tools", a.key, a.size, false, a.defaultVal);
      console.log(`✓ Created attribute: ${a.key}`);
    } catch (e) {
      if (e.code === 409) {
        // Already exists
      } else {
        console.warn(`Attribute '${a.key}' warning:`, e.message);
      }
    }
  }
}

async function tagTools() {
  console.log("Ensuring schema attributes on tools collection...");
  await ensureAttributes();

  console.log("\nTagging tools in Appwrite...");
  let cursor = null;
  let updated = 0;

  while (true) {
    const q = [Query.limit(100)];
    if (cursor) q.push(Query.cursorAfter(cursor));
    const docs = await db.listDocuments(DATABASE_ID, "tools", q);
    if (!docs.documents.length) break;

    for (const doc of docs.documents) {
      let pro_backend = "appwrite";
      let azure_container = null;
      let azure_endpoint = null;

      if (AZURE_PDF_TOOLS.has(doc.slug)) {
        pro_backend = "azure";
        azure_container = "pdf";
        azure_endpoint = `/pdf/${doc.slug.replace(/^pdf-/, '')}`;
      } else if (AZURE_IMAGE_TOOLS.has(doc.slug)) {
        pro_backend = "azure";
        azure_container = "image";
        azure_endpoint = `/image/${doc.slug.replace(/^image-/, '')}`;
      } else if (AZURE_MEDIA_TOOLS.has(doc.slug)) {
        pro_backend = "azure";
        azure_container = "media";
        azure_endpoint = `/media/${doc.slug}`;
      }

      let attempts = 0;
      let updatedDoc = false;
      while (attempts < 5 && !updatedDoc) {
        try {
          attempts++;
          await db.updateDocument(DATABASE_ID, "tools", doc.$id, {
            free_backend: "appwrite",
            pro_backend,
            azure_container,
            azure_endpoint
          });
          updatedDoc = true;
        } catch (err) {
          if (attempts >= 5) {
            console.error(`Failed to update ${doc.slug}:`, err.message);
          } else {
            await new Promise(r => setTimeout(r, 1000 * attempts));
          }
        }
      }

      console.log(`  ✓ ${doc.slug.padEnd(45)} → free: appwrite | pro: ${pro_backend}${azure_container ? ` (${azure_container})` : ''}`);
      updated++;
      await new Promise(r => setTimeout(r, 60));
    }

    if (docs.documents.length < 100) break;
    cursor = docs.documents[docs.documents.length - 1].$id;
  }

  console.log(`\n✅ Tagged ${updated} tools with backend attributes.`);
}

tagTools().catch(console.error);
