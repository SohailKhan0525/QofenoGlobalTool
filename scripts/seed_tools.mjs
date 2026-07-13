#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, Databases, Query, ID } from 'node-appwrite';

function loadEnv() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(process.cwd(), '.env.server'),
    path.resolve(process.cwd(), 'QofenoGlobalTool', '.env.server'),
    path.resolve(scriptDir, '..', '.env.server'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(scriptDir, '..', '.env'),
  ];
  const envPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!envPath) throw new Error('Unable to find .env or .env.server');

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(\w+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  }
  return envPath;
}

function assertEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required in env`);
  return value;
}

// ── Long Text Blocks of Tools to Parse ──────────────────────────────────────

const pdfFreeStr = `
pdf-merge                   Merge PDF
pdf-split                   Split PDF
pdf-compress                Compress PDF
pdf-rotate                  Rotate PDF
pdf-to-jpg                  PDF to JPG
pdf-to-png                  PDF to PNG
pdf-to-txt                  PDF to TXT
pdf-to-webp                 PDF to WebP
jpg-to-pdf                  JPG to PDF
png-to-pdf                  PNG to PDF
pdf-page-numbers            Add Page Numbers
pdf-word-count              PDF Word Count
pdf-metadata-viewer         View PDF Metadata
pdf-rearrange-pages         Rearrange Pages
pdf-delete-pages            Delete Pages
pdf-extract-pages           Extract Pages
pdf-duplicate-pages         Duplicate Pages
pdf-insert-blank            Insert Blank Page
pdf-reverse-pages           Reverse Page Order
pdf-sort-pages              Sort Pages
pdf-remove-blank-pages      Remove Blank Pages
pdf-extract-text            Extract Text from PDF
pdf-to-markdown             PDF to Markdown
pdf-to-csv                  PDF to CSV
txt-to-pdf                  TXT to PDF
markdown-to-pdf             Markdown to PDF
csv-to-pdf                  CSV to PDF
`;

const pdfProStr = `
pdf-to-word                 PDF to Word (.docx)
pdf-to-excel                PDF to Excel (.xlsx)
pdf-to-powerpoint           PDF to PowerPoint
pdf-to-html                 PDF to HTML
pdf-to-tiff                 PDF to TIFF
pdf-to-svg                  PDF to SVG
pdf-to-rtf                  PDF to RTF
pdf-to-odt                  PDF to ODT
pdf-to-epub                 PDF to EPUB
pdf-to-json                 PDF to JSON
pdf-to-xml                  PDF to XML
word-to-pdf                 Word to PDF
excel-to-pdf                Excel to PDF
ppt-to-pdf                  PPT to PDF
jpg-to-pdf-adv              JPG to PDF (Advanced)
tiff-to-pdf                 TIFF to PDF
svg-to-pdf                  SVG to PDF
html-to-pdf                 HTML to PDF
epub-to-pdf                 EPUB to PDF
rtf-to-pdf                  RTF to PDF
odt-to-pdf                  ODT to PDF
doc-to-pdf                  DOC to PDF
webp-to-pdf                 WebP to PDF
json-to-pdf                 JSON to PDF
xml-to-pdf                  XML to PDF
pdf-crop                    Crop PDF
pdf-resize                  Resize PDF Pages
pdf-flatten                 Flatten PDF
pdf-optimize                Optimize PDF
pdf-repair                  Repair PDF
pdf-linearize               Linearize PDF
pdf-protect                 Protect PDF
pdf-unlock                  Unlock PDF
pdf-remove-password         Remove Password
pdf-change-password         Change Password
pdf-encrypt                 Encrypt PDF
pdf-decrypt                 Decrypt PDF
pdf-add-signature           Add Digital Signature
pdf-verify-signature        Verify Digital Signature
pdf-remove-signature        Remove Digital Signature
pdf-redact                  Redact PDF
pdf-add-watermark           Add Watermark
pdf-remove-watermark        Remove Watermark
pdf-add-header              Add Header
pdf-add-footer              Add Footer
pdf-remove-page-numbers     Remove Page Numbers
pdf-add-bookmarks           Add Bookmarks
pdf-create-form             Create PDF Form
pdf-fill-form               Fill PDF Form
pdf-edit-form               Edit PDF Form
pdf-flatten-form            Flatten PDF Form
pdf-extract-form-data       Extract Form Data
pdf-extract-images          Extract Images
pdf-replace-images          Replace Images
pdf-compress-images         Compress Images in PDF
pdf-remove-images           Remove Images
pdf-to-grayscale            Convert to Grayscale
pdf-extract-page-png        Extract Page as PNG
pdf-extract-page-jpg        Extract Page as JPG
pdf-search                  Search PDF
pdf-ocr                     OCR PDF
pdf-searchable              Create Searchable PDF
pdf-analyze-fonts           Analyze Fonts
pdf-embed-fonts             Embed Fonts
pdf-remove-fonts            Remove Embedded Fonts
pdf-extract-tables          Extract Tables
pdf-table-to-excel          PDF Table to Excel
pdf-table-to-csv            PDF Table to CSV
pdf-edit-metadata           Edit PDF Metadata
pdf-remove-metadata         Remove PDF Metadata
pdf-compare                 Compare PDFs
pdf-compare-text            Compare PDF Text
pdf-to-bw                   Convert to Black & White
pdf-adjust-brightness       Adjust Brightness
pdf-adjust-contrast         Adjust Contrast
pdf-reduce-resolution       Reduce Resolution
pdf-change-paper-size       Change Paper Size
pdf-a4-to-letter            A4 to Letter
pdf-letter-to-a4            Letter to A4
pdf-bookmark-manager        Bookmark Manager
pdf-generate-toc            Generate Table of Contents
pdf-manage-page-labels      Manage Page Labels
pdf-n-up                    N-Up PDF
pdf-images-to-pdf           Images to PDF (Multi)
pdf-sign                    Sign PDF
pdf-highlight               Highlight PDF
pdf-underline               Underline Text
pdf-strikeout               Strikeout Text
pdf-add-shapes              Add Shapes
pdf-add-comments            Add Comments
pdf-add-sticky-notes        Add Sticky Notes
pdf-add-hyperlinks          Add Hyperlinks
pdf-insert-pages            Insert PDF Pages
pdf-replace-pages           Replace Pages
pdf-rename-pages            Rename Pages
pdf-print-ready             Print-Ready PDF
pdf-cmyk                    CMYK PDF Conversion
pdf-add-bleed               Add Bleed Settings
pdf-add-cropmarks           Add Crop Marks
`;

const pdfTeamsStr = `
pdf-batch-merge             Batch Merge PDFs
pdf-batch-split             Batch Split PDFs
pdf-batch-compress          Batch Compress PDFs
pdf-batch-convert           Batch Convert PDFs
pdf-batch-ocr               Batch OCR PDFs
pdf-batch-watermark         Batch Watermark PDFs
pdf-batch-rotate            Batch Rotate PDFs
pdf-batch-encrypt           Batch Encrypt PDFs
pdf-batch-decrypt           Batch Decrypt PDFs
`;

const pdfComingSoonStr = `
pdf-ai-chat                 AI PDF Chat
pdf-ai-summary              AI PDF Summary
pdf-ai-translate            AI PDF Translation
pdf-ai-rewrite              AI PDF Rewrite
pdf-ai-explain              AI PDF Explanation
pdf-ai-qa                   AI PDF Q&A
pdf-ai-table                AI Table Extraction
pdf-ai-invoice              AI Invoice Extraction
pdf-ai-contract             AI Contract Analysis
pdf-ai-resume               AI Resume Parser
pdf-ai-extract              AI Data Extraction
pdf-ai-classify             AI Document Classification
pdf-ai-ocr                  AI OCR
pdf-ai-keywords             AI Keyword Extraction
pdf-cloud-storage           Cloud PDF Storage
pdf-sharing                 PDF Sharing
pdf-team-workspace          Team PDF Workspace
pdf-version-history         PDF Version History
pdf-api                     PDF API
pdf-webhooks                PDF Webhooks
pdf-file-sync               File Sync
pdf-scheduled-processing    Scheduled PDF Processing
pdf-draw                    Draw PDF
pdf-booklet                 Booklet PDF
pdf-imposition              PDF Imposition
pdf-portfolio               PDF Portfolio
pdf-compare-images          Compare PDF Images
pdf-compare-layout          Compare PDF Layout
pdf-invert-colors           Invert PDF Colors
pdf-increase-resolution     Increase PDF Resolution
pdf-rgb-conversion          RGB PDF Conversion
pdf-print-preview           PDF Print Preview
pdf-batch-rename            Batch Rename PDFs
pdf-find-replace            PDF Find & Replace
pdf-remove-text             Remove Text from PDF
pdf-add-text                Add Text to PDF
pdf-import-form-data        Import PDF Form Data
pdf-export-form-data        Export PDF Form Data
`;

const imageFreeStr = `
image-resize                Resize Image
image-crop                  Crop Image
image-compress              Compress Image
image-rotate                Rotate Image
image-flip                  Flip Image
image-mirror                Mirror Image
image-blur                  Blur Image
image-sharpen               Sharpen Image
image-grayscale             Grayscale Converter
image-bw                    Black & White Converter
image-sepia                 Sepia Filter
image-negative              Negative Image
image-invert                Image Inverter
image-brightness            Brightness Adjuster
image-contrast              Contrast Adjuster
image-saturation            Saturation Adjuster
image-gamma                 Gamma Correction
image-metadata              Image Metadata Viewer
image-remove-metadata       Remove Metadata/EXIF
jpg-to-png                  JPG to PNG
png-to-jpg                  PNG to JPG
png-to-webp                 PNG to WebP
webp-to-png                 WebP to PNG
jpg-to-webp                 JPG to WebP
webp-to-jpg                 WebP to JPG
gif-to-png                  GIF to PNG
png-to-gif                  PNG to GIF
bmp-to-jpg                  BMP to JPG
jpg-to-bmp                  JPG to BMP
tiff-to-jpg                 TIFF to JPG
jpg-to-tiff                 JPG to TIFF
avif-to-jpg                 AVIF to JPG
jpg-to-avif                 JPG to AVIF
heic-to-jpg                 HEIC to JPG
svg-to-png                  SVG to PNG
pdf-to-image-simple         PDF to Image
image-to-pdf-simple         Image to PDF
image-add-border            Add Border
image-round-corners         Round Corners
color-picker                Color Picker
dominant-color              Dominant Color Extractor
image-comparison            Image Comparison
ico-generator               ICO Generator
favicon-generator           Favicon Generator
image-pixelate              Pixelate Image
image-histogram             Histogram Viewer
image-resolution-changer    Resolution Changer
image-dpi-changer           DPI Changer
image-aspect-ratio          Aspect Ratio Converter
thumbnail-creator           Thumbnail Creator
qr-on-image                 QR Code on Image
`;

const imageProStr = `
image-bg-remover            Background Remover
image-watermark             Watermark Image
image-remove-watermark      Remove Watermark
image-add-text              Add Text to Image
image-add-logo              Add Logo to Image
image-color-balance         Color Balance
image-hue                   Hue Adjuster
image-exposure              Exposure Adjuster
image-exif-editor           EXIF Editor
image-color-palette         Color Palette Generator
image-noise-reduction       Noise Reduction
image-upscale               Image Upscaler (2x)
image-auto-crop             Auto Crop
image-smart-crop            Smart Crop
image-face-crop             Face Crop
image-splitter              Image Splitter
image-merger                Image Merger
image-collage               Collage Maker
image-meme                  Meme Generator
image-social-post           Social Media Image Creator
image-instagram             Instagram Post Creator
image-fb-cover              Facebook Cover Creator
image-yt-thumbnail          YouTube Thumbnail Creator
image-linkedin-banner       LinkedIn Banner Creator
image-twitter-header        Twitter Header Creator
image-gif-maker             GIF Maker
image-gif-optimizer         GIF Optimizer
image-gif-speed             GIF Speed Changer
image-frame-extractor       Image Frame Extractor
image-sprite-sheet          Sprite Sheet Generator
image-contact-sheet         Contact Sheet Generator
image-animated-webp         Animated WebP Creator
image-edge-detection        Edge Detection
image-sketch                Sketch Effect
image-cartoon               Cartoon Effect
image-oil-painting          Oil Painting Effect
image-vintage               Vintage Filter
image-svg-optimizer         SVG Optimizer
image-psd-to-png            PSD to PNG
image-raw-to-jpg            RAW to JPG
image-screenshot-editor     Screenshot Editor
image-annotation            Image Annotation Tool
image-mosaic                Mosaic Effect
image-lossless              Lossless Compression
image-multi-export          Multi-format Export
image-large-processing      Large Image Processing
png-to-svg                  PNG to SVG
jpg-to-heic                 JPG to HEIC
brand-kit                   Brand Kit Generator
og-image                    OG Image Generator
image-preview               Image Preview Generator
`;

const imageTeamsStr = `
image-batch-resize          Batch Resize
image-batch-compress        Batch Compress
image-batch-convert         Batch Convert
image-batch-watermark       Batch Watermark
image-batch-rename          Batch Rename Images
image-batch-optimize        Batch Optimization
image-duplicate-finder      Duplicate Image Finder
`;

const imageComingSoonStr = `
image-ai-bg-remove          AI Background Removal
image-ai-object-remove      AI Object Removal
image-ai-upscaler           AI Image Upscaler
image-ai-face-restore       AI Face Restoration
image-ai-portrait           AI Portrait Enhancer
image-ai-colorizer          AI Image Colorizer
image-ai-inpaint            AI Inpainting
image-ai-outpaint           AI Outpainting
image-ai-generate           AI Image Generator
image-ai-logo               AI Logo Generator
image-ai-banner             AI Banner Generator
image-ai-product-photo      AI Product Photo Generator
image-ai-fashion            AI Fashion Model Generator
image-ai-watermark-remove   AI Watermark Removal
image-ai-denoiser           AI Image Denoiser
image-ai-relight            AI Relighting
image-cloud-storage         Cloud Image Storage
image-api                   Image API
image-version-history       Image Version History
image-psd-preview           PSD Preview
image-raw-viewer            RAW Image Viewer
image-priority-processing   Image Priority Processing
`;

const videoFreeStr = `
video-trim                  Trim Video
video-crop                  Crop Video
video-compress              Compress Video
video-rotate                Rotate Video
video-flip                  Flip Video
video-reverse               Reverse Video
video-loop                  Loop Video
video-mute                  Mute Video
video-remove-audio          Remove Audio
video-extract-audio         Extract Audio
video-speed                 Video Speed Changer
video-slow-motion           Slow Motion Video
video-fast-motion           Fast Motion Video
video-resolution            Resolution Changer
video-fps                   FPS Changer
video-to-gif                Video to GIF
video-frame-extractor       Frame Extractor
video-thumbnail             Thumbnail Extractor
video-metadata              Video Metadata Viewer
video-to-mp3                Video to MP3
video-to-wav                Video to WAV
video-to-aac                Video to AAC
mp4-converter               MP4 Converter
mov-converter               MOV Converter
avi-converter               AVI Converter
mkv-converter               MKV Converter
webm-converter              WebM Converter
gif-to-video                GIF to Video
video-to-images             Video to Images
images-to-video             Images to Video
video-square                Square Video Creator
video-vertical              Vertical Video Converter
video-horizontal            Horizontal Video Converter
`;

const videoProStr = `
video-merge                 Merge Videos
video-split                 Split Video
video-brightness            Brightness Adjustment
video-contrast              Contrast Adjustment
video-saturation            Saturation Adjustment
video-color-correction      Color Correction
video-sharpen               Video Sharpening
video-blur-effect           Blur Video
video-watermark             Watermark Video
video-remove-watermark      Remove Watermark
video-add-text              Add Text to Video
video-add-logo              Add Logo to Video
video-add-intro             Add Intro
video-add-outro             Add Outro
video-add-music             Add Background Music
video-fade-in               Fade In
video-fade-out              Fade Out
video-replace-audio         Replace Audio
video-bitrate               Bitrate Changer
video-aspect-ratio          Aspect Ratio Converter
video-stabilize             Video Stabilization
video-denoiser              Video Denoiser
video-subtitle-embed        Subtitle Embedder
video-subtitle-extract      Subtitle Extractor
video-subtitle-convert      Subtitle Converter
video-hardcode-subtitles    Hardcode Subtitles
video-chapter               Chapter Creator
video-metadata-edit         Video Metadata Editor
video-audio-sync            Audio Sync Tool
video-contact-sheet         Contact Sheet Generator
video-preview               Video Preview Generator
video-flv-converter         FLV Converter
video-wmv-converter         WMV Converter
video-mpeg-converter        MPEG Converter
video-m4v-converter         M4V Converter
video-3gp-converter         3GP Converter
video-animated-webp         Animated WebP Creator
video-comparison            Video Comparison
video-social-youtube        YouTube Video Exporter
video-social-instagram      Instagram Reel Exporter
video-social-tiktok         TikTok Video Exporter
video-social-facebook       Facebook Video Exporter
video-social-linkedin       LinkedIn Video Exporter
video-joiner                Video Joiner Advanced
`;

const videoTeamsStr = `
video-batch-convert         Batch Video Conversion
video-batch-compress        Batch Compression
video-batch-trim            Batch Trimming
video-batch-watermark       Batch Watermarking
video-batch-split           Batch Video Splitting
video-batch-merge           Batch Video Merging
video-multi-export          Multi-format Export
video-large-processing      Large Video Processing
video-faster-encoding       Faster Encoding
video-multi-audio           Multi-track Audio Support
video-multi-subtitle        Multi-track Subtitle
video-splitter-bulk         Video Splitter Bulk
`;

const videoComingSoonStr = `
video-cloud-render          Cloud Rendering
video-cloud-queue           Cloud Queue
video-hardware-accel        Hardware Acceleration
video-api                   Video API
video-team-workspace        Team Workspace
video-version-history       Video Version History
video-priority-processing   Video Priority Processing
video-soft-subtitles        Video Soft Subtitles
`;

const audioFreeStr = `
audio-mp3                   MP3 Converter
audio-wav                   WAV Converter
audio-aac                   AAC Converter
audio-ogg                   OGG Converter
audio-flac                  FLAC Converter
audio-m4a                   M4A Converter
audio-aiff                  AIFF Converter
audio-wma                   WMA Converter
audio-opus                  OPUS Converter
audio-amr                   AMR Converter
audio-trim                  Trim Audio
audio-cut                   Cut Audio
audio-merge                 Merge Audio
audio-split                 Split Audio
audio-compress              Audio Compressor
audio-volume                Volume Booster
audio-normalize             Audio Normalizer
audio-speed                 Change Speed
audio-pitch                 Change Pitch
audio-fade-in               Fade In
audio-fade-out              Fade Out
audio-silence-remover       Silence Remover
audio-reverse               Audio Reverser
audio-mono                  Mono Converter
audio-stereo                Stereo Converter
audio-metadata              Audio Metadata Viewer
audio-remove-metadata       Remove Metadata
audio-extract-from-video    Extract Audio from Video
audio-waveform              Waveform Generator
audio-format-pack           Audio Format Pack
audio-preview               Audio Preview Generator
`;

const audioProStr = `
audio-bass-booster          Bass Booster
audio-treble-booster        Treble Booster
audio-equalizer             Audio Equalizer
audio-noise-reduction       Noise Reduction
audio-echo-removal          Echo Removal
audio-reverb                Reverb Effect
audio-voice-changer         Voice Changer
audio-channel-mixer         Channel Mixer
audio-balance               Balance Adjuster
audio-metadata-edit         Audio Metadata Editor
audio-cover-art             Cover Art Editor
audio-batch-tags            Batch Tag Editor
audio-replace-in-video      Replace Audio in Video
audio-ringtone              Ringtone Maker
audio-frequency             Frequency Analyzer
audio-spectrogram           Spectrogram Generator
audio-loudness              Loudness Analyzer
audio-bpm                   BPM Detector
audio-vocal-isolation       Vocal Isolation
audio-instrument-remove     Instrument Removal
audio-karaoke               Karaoke Maker
audio-comparison            Audio Comparison
audio-watermark             Audio Watermarking
audio-enhancer              Audio Enhancer
audio-podcast-cleaner       Podcast Cleaner
audio-joiner                Audio Joiner Advanced
audio-key-detector          Key Detector
`;

const audioTeamsStr = `
audio-batch-convert         Batch Audio Conversion
audio-batch-compress        Batch Compression
audio-batch-trim            Batch Trimming
audio-batch-cut             Batch Audio Cutter
audio-batch-join            Batch Audio Joiner
audio-batch-normalize       Batch Normalization
audio-batch-volume          Batch Volume Adjustment
audio-batch-metadata        Batch Metadata Editing
audio-multi-export          Multi-format Export
audio-large-processing      Large Audio Processing
audio-splitter-bulk         Audio Splitter Bulk
`;

const audioComingSoonStr = `
audio-music-separation      Audio Music Separation
audio-duplicate-finder      Duplicate Audio Finder
audio-fingerprinting        Audio Fingerprinting
audio-cloud-processing      Cloud Audio Processing
audio-cloud-queue           Cloud Queue
audio-api                   Audio API
audio-team-workspace        Team Workspace
audio-version-history       Audio Version History
audio-priority-processing   Audio Priority Processing
audio-voice-recorder        Audio Voice Recorder
audio-recorder              Audio Recorder
`;

const devFreeStr = `
json-formatter              JSON Parser & Formatter
base64-encoder              Base64 Native Encoder
word-counter                Text Word & Character Counter
text-case-converter         Text Case Converter
`;

function parseBlock(blockStr, category, type, isComingSoon = false) {
  return blockStr.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//'))
    .map(line => {
      const parts = line.split(/\s{2,}/);
      if (parts.length < 2) return null;
      const slug = parts[0].trim();
      const name = parts[1].trim();
      return {
        slug,
        name,
        category,
        is_free: type === 'Free',
        is_coming_soon: isComingSoon,
        is_active: !isComingSoon,
        type
      };
    })
    .filter(Boolean);
}

function subcategorize(slug) {
  if (slug.includes('compress') || slug.includes('optimize')) return 'Compressors';
  if (slug.includes('convert') || slug.includes('to')) return 'Converters';
  if (slug.includes('merge') || slug.includes('combine') || slug.includes('join')) return 'Combiners';
  if (slug.includes('split') || slug.includes('extract')) return 'Separators';
  if (slug.includes('manipulator') || slug.includes('edit') || slug.includes('change') || slug.includes('set') || slug.includes('add') || slug.includes('remove') || slug.includes('rearrange') || slug.includes('delete') || slug.includes('reverse') || slug.includes('sort')) return 'Editors';
  if (slug.includes('resize') || slug.includes('crop') || slug.includes('trim') || slug.includes('cut')) return 'Resizers';
  return 'Utilities';
}

function getAcceptedTypes(slug, cat) {
  if (cat === 'PDF & Documents') {
    if (slug.startsWith('pdf-')) return ['application/pdf'];
    if (slug.startsWith('word-')) return ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (slug.startsWith('excel-')) return ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (slug.startsWith('ppt-')) return ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    return ['*/*'];
  }
  if (cat === 'Image Tools') return ['image/*'];
  if (cat === 'Video Tools') return ['video/*'];
  if (cat === 'Audio Tools') return ['audio/*'];
  return ['*/*'];
}

function getOutputType(slug, cat) {
  if (cat === 'PDF & Documents') {
    if (slug.includes('to-jpg')) return 'image/jpeg';
    if (slug.includes('to-png')) return 'image/png';
    if (slug.includes('to-txt') || slug.includes('to-text')) return 'text/plain';
    if (slug.includes('to-csv')) return 'text/csv';
    if (slug.includes('to-markdown')) return 'text/markdown';
    if (slug.includes('to-json')) return 'application/json';
    return 'application/pdf';
  }
  if (cat === 'Image Tools') {
    if (slug.includes('to-png')) return 'image/png';
    if (slug.includes('to-jpg') || slug.includes('to-jpeg')) return 'image/jpeg';
    if (slug.includes('to-webp')) return 'image/webp';
    if (slug.includes('to-gif')) return 'image/gif';
    return 'image/*';
  }
  if (cat === 'Video Tools') {
    if (slug.includes('to-mp3')) return 'audio/mp3';
    if (slug.includes('to-gif')) return 'image/gif';
    return 'video/mp4';
  }
  if (cat === 'Audio Tools') {
    if (slug.includes('to-mp3') || slug.endsWith('-mp3')) return 'audio/mp3';
    return 'audio/*';
  }
  return 'text/plain';
}

function getIconName(cat) {
  if (cat === 'PDF & Documents') return 'faFileLines';
  if (cat === 'Image Tools') return 'faImageIcon';
  if (cat === 'Video Tools') return 'faVideo';
  if (cat === 'Audio Tools') return 'faMusic';
  return 'faCode';
}

let databases;

async function upsertTool(dbId, tool) {
  const payload = {
    slug: tool.slug,
    name: tool.name,
    description: tool.description,
    category: tool.category,
    subcategory: tool.subcategory,
    is_free: tool.is_free,
    is_coming_soon: tool.is_coming_soon,
    is_active: tool.is_active,
    is_new: false,
    function_id: tool.function_id,
    icon: tool.icon || '',
    tags: tool.tags || [],
    max_file_size_free: tool.max_file_size_free,
    max_file_size_pro: tool.max_file_size_pro,
    accepted_types: tool.accepted_types,
    output_type: tool.output_type,
    is_new_until: tool.is_new_until || null,
    updated_at: new Date().toISOString(),
  };

  try {
    const existing = await databases.listDocuments(dbId, 'tools', [
      Query.equal('slug', tool.slug)
    ]);

    if (existing.total > 0) {
      const docId = existing.documents[0].$id;
      await databases.updateDocument(dbId, 'tools', docId, payload);
      console.log(`Updated ${tool.slug}`);
    } else {
      payload.created_at = new Date().toISOString();
      await databases.createDocument(dbId, 'tools', ID.unique(), payload);
      console.log(`Created ${tool.slug}`);
    }
  } catch (error) {
    console.error(`Failed to upsert ${tool.slug}:`, error.message);
    throw error;
  }
}

async function main() {
  const envPath = loadEnv();
  console.log(`Loaded env: ${envPath}`);
  const endpoint = assertEnv('APPWRITE_ENDPOINT');
  const projectId = assertEnv('APPWRITE_PROJECT_ID');
  const apiKey = assertEnv('APPWRITE_API_KEY');
  const dbId = process.env.DATABASE_ID || 'qofeno_db';

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  databases = new Databases(client);

  const parsedTools = [
    ...parseBlock(pdfFreeStr, 'PDF & Documents', 'Free'),
    ...parseBlock(pdfProStr, 'PDF & Documents', 'Pro'),
    ...parseBlock(pdfTeamsStr, 'PDF & Documents', 'Teams'),
    ...parseBlock(pdfComingSoonStr, 'PDF & Documents', 'Coming Soon', true),
    ...parseBlock(imageFreeStr, 'Image Tools', 'Free'),
    ...parseBlock(imageProStr, 'Image Tools', 'Pro'),
    ...parseBlock(imageTeamsStr, 'Image Tools', 'Teams'),
    ...parseBlock(imageComingSoonStr, 'Image Tools', 'Coming Soon', true),
    ...parseBlock(videoFreeStr, 'Video Tools', 'Free'),
    ...parseBlock(videoProStr, 'Video Tools', 'Pro'),
    ...parseBlock(videoTeamsStr, 'Video Tools', 'Teams'),
    ...parseBlock(videoComingSoonStr, 'Video Tools', 'Coming Soon', true),
    ...parseBlock(audioFreeStr, 'Audio Tools', 'Free'),
    ...parseBlock(audioProStr, 'Audio Tools', 'Pro'),
    ...parseBlock(audioTeamsStr, 'Audio Tools', 'Teams'),
    ...parseBlock(audioComingSoonStr, 'Audio Tools', 'Coming Soon', true),
    ...parseBlock(devFreeStr, 'Developer Tools', 'Free'),
  ];

  console.log(`Total parsed tools: ${parsedTools.length}`);

  let newUntil = new Date();
  newUntil.setDate(newUntil.getDate() + 7);
  const newUntilStr = newUntil.toISOString();

  const batchSize = 30;
  for (let i = 0; i < parsedTools.length; i += batchSize) {
    const batch = parsedTools.slice(i, i + batchSize);
    await Promise.all(batch.map(async (t) => {
      const subcat = subcategorize(t.slug);
      const icon = getIconName(t.category);
      const accepted = getAcceptedTypes(t.slug, t.category);
      const output = getOutputType(t.slug, t.category);

      const envKey = `VITE_APPWRITE_FUNCTION_${t.slug.toUpperCase().replace(/-/g, '_')}_ID`;
      let functionId = process.env[envKey] || t.slug;

      if (t.is_coming_soon) {
        functionId = 'none';
      }

      const maxFree = 52428800; // 50MB
      const maxPro = t.type === 'Teams' ? 1073741824 : 524288000; // 1GB for Teams, 500MB for Pro

      const seededTool = {
        slug: t.slug,
        name: t.name,
        category: t.category,
        subcategory: subcat,
        description: `Premium, lightning-fast ${t.name} tool running directly in your browser or securely on our sandboxed servers.`,
        is_free: t.is_free,
        is_coming_soon: t.is_coming_soon,
        is_active: t.is_active,
        function_id: functionId,
        icon,
        tags: t.slug.split('-'),
        max_file_size_free: maxFree,
        max_file_size_pro: maxPro,
        accepted_types: accepted,
        output_type: output,
        is_new_until: newUntilStr
      };

      await upsertTool(dbId, seededTool);
    }));
    console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(parsedTools.length / batchSize)}`);
  }

  console.log('Seeding finished successfully.');
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});