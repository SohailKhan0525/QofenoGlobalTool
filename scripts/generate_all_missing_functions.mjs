import fs from 'fs';
import path from 'path';

// Define tool blocks exactly as in seed_tools.mjs
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
heic-to-jpg                 HEIC to JPG
heic-to-png                 HEIC to PNG
avif-to-jpg                 AVIF to JPG
jpg-to-avif                 JPG to AVIF
image-add-text              Add Text to Image
image-add-watermark         Add Watermark to Image
image-resize-percent        Resize Image by Percent
image-round-corners         Round Corners
image-add-border            Add Border to Image
image-shadow-effect         Add Shadow Effect
image-pixelate              Pixelate Image
image-filter-vintage        Vintage Filter
image-filter-cool           Cool Filter
image-filter-warm           Warm Filter
image-filter-sketch         Sketch Effect
image-filter-cartoon        Cartoon Effect
image-filter-emboss         Emboss Effect
image-filter-oil            Oil Paint Effect
image-vignette              Vignette Effect
image-color-picker          Image Color Picker
`;

const imageProStr = `
image-bg-remover            Remove Background
image-transparent           Make Background Transparent
image-color-replace         Replace Color in Image
image-svg-to-png            SVG to PNG
png-to-svg                  PNG to SVG
image-webp-to-gif           WebP to GIF
gif-to-webp                 GIF to WebP
image-tiff-to-png           TIFF to PNG
png-to-tiff                 PNG to TIFF
image-eps-to-png            EPS to PNG
image-psd-to-png            PSD to PNG
image-pdf-to-png            PDF to PNG
image-heic-to-webp          HEIC to WebP
image-raw-to-jpg            RAW to JPG
image-ico-generator         ICO Generator
image-favicon-generator     Favicon Generator
image-palette-generator     Color Palette Generator
image-dominant-color        Dominant Color Finder
image-histogram             Image Histogram Generator
image-metadata-editor       Edit Image Metadata
image-exif-cleaner          Clean EXIF Metadata
image-comparison            Image Comparison (Slider)
image-split                 Split Image
image-collage-maker         Collage Maker
image-gif-splitter          GIF Splitter
image-gif-joiner            GIF Joiner
image-aspect-ratio          Aspect Ratio Calculator
image-dpi-changer           DPI Changer
image-thumbnail-generator   Thumbnail Generator
image-watermark-remover     Remove Watermark
image-resolution-upscale    Upscale Image Resolution
image-deblur                Deblur Image
image-denoise               Denoise Image
image-color-corrector       Color Corrector
image-contrast-auto         Auto Contrast
image-brightness-auto       Auto Brightness
image-hdr-effect            HDR Effect
image-sharpen-adv           Advanced Sharpening
image-denoise-adv           Advanced Denoise
image-red-eye-remover       Red-Eye Remover
image-text-extractor        OCR Image Text Extractor
image-qr-scanner            QR Code Scanner
image-barcode-scanner       Barcode Scanner
image-qr-generator          QR Code Generator
image-barcode-generator     Barcode Generator
image-add-logo              Add Logo to Image
image-photo-frames          Add Photo Frames
image-crop-circle           Crop Image as Circle
image-crop-aspect           Crop to Aspect Ratio
image-extract-gifs          Extract GIF Frames
image-compress-gif          Compress GIF
`;

const imageTeamsStr = `
image-batch-resize          Batch Resize Images
image-batch-convert         Batch Convert Images
image-batch-compress        Batch Compress Images
image-batch-rename          Batch Rename Images
image-batch-watermark       Batch Watermark Images
image-batch-rotate          Batch Rotate Images
image-batch-crop            Batch Crop Images
`;

const imageComingSoonStr = `
image-ai-enhancer           AI Image Enhancer
image-ai-bg-remover         AI Background Remover
image-ai-generator          AI Image Generator
image-ai-upscaler           AI Image Upscaler
image-ai-restoration        AI Photo Restoration
image-ai-colourizer         AI Photo Colourizer
image-ai-cartoonizer        AI Cartoonizer
image-ai-face-swap          AI Face Swap
image-ai-avatar-generator   AI Avatar Generator
image-ai-object-remover     AI Object Remover
image-ai-inpainting         AI Image Inpainting
image-ai-outpainting        AI Image Outpainting
image-ai-text-to-image      AI Text to Image
image-ai-image-to-image     AI Image to Image
image-ai-style-transfer     AI Style Transfer
image-ai-super-resolution   AI Super Resolution
image-cloud-storage         Cloud Image Storage
image-sharing               Image Sharing
image-team-workspace        Team Image Workspace
image-version-history       Image Version History
image-api                   Image API
image-webhooks              Image Webhooks
`;

const videoFreeStr = `
video-compress              Compress Video
video-trim                  Trim Video
video-cut                   Cut Video
video-crop                  Crop Video
video-rotate                Rotate Video
video-flip                  Flip Video
video-mirror                Mirror Video
video-mute                  Mute Video (Remove Audio)
video-extract-audio         Extract Audio from Video
video-to-gif                Video to GIF
video-to-mp4                Video to MP4
video-to-mov                Video to MOV
video-to-avi                Video to AVI
video-to-webm               Video to WebM
video-to-mkv                Video to MKV
video-to-flv                Video to FLV
mp4-to-mp3                  MP4 to MP3
mov-to-mp4                  MOV to MP4
avi-to-mp4                  AVI to MP4
webm-to-mp4                 WebM to MP4
mkv-to-mp4                  MKV to MP4
video-speed-up              Speed Up Video
video-slow-motion           Slow Motion Video
video-reverse               Reverse Video
video-loop                  Loop Video
video-thumbnail             Extract Thumbnail
video-metadata              Video Metadata Viewer
video-remove-metadata       Remove Video Metadata
video-adjust-volume         Adjust Video Volume
video-aspect-ratio          Change Aspect Ratio
video-resolution            Change Video Resolution
video-fps                   Change Video FPS
video-bitrate               Change Video Bitrate
`;

const videoProStr = `
video-batch-compress        Batch Compress Videos
video-batch-convert         Batch Convert Videos
video-merge                 Merge Videos
video-joiner                Video Joiner Advanced
video-split                 Split Video
video-subtitle-merge        Merge Subtitles into Video
video-watermark-add         Add Watermark to Video
video-watermark-remove      Remove Watermark from Video
video-logo-add              Add Logo to Video
video-gif-to-mp4            GIF to MP4
video-images-to-video       Images to Video
video-slideshow-maker       Slideshow Maker
video-screen-recorder       Screen Recorder (Web)
video-camera-recorder       Camera Recorder
video-audio-sync            Sync Video and Audio
video-fade-in               Video Fade In
video-fade-out              Video Fade Out
video-stabilization         Video Stabilization
video-denoise               Video Denoise
video-color-corrector       Video Color Corrector
video-contrast-adjust       Video Contrast Adjuster
video-brightness-adjust     Video Brightness Adjuster
video-saturation-adjust     Video Saturation Adjuster
video-compress-large        Compress Large Video
video-priority-processing   Priority Processing
video-chapters-creator      Create Video Chapters
video-metadata-edit         Edit Video Metadata
video-audio-replace         Replace Audio in Video
video-audio-delay           Add Audio Delay
video-trim-precise          Precise Frame Trimming
video-gif-generator         GIF Generator from Video
video-frame-extractor       Extract All Frames (ZIP)
video-transition-effects    Add Transition Effects
video-intro-maker           Video Intro Maker
video-outro-maker           Video Outro Maker
video-text-overlay          Add Text Overlay to Video
video-subtitles-generator   Auto Subtitles Generator
video-srt-editor            SRT Subtitle Editor
video-vtt-editor            VTT Subtitle Editor
video-ass-editor            ASS Subtitle Editor
video-format-pack           Video Format Pack
video-h264-encoder          H.264 Encoder
video-h265-encoder          H.265 Encoder
video-hevc-encoder          HEVC Video Converter
`;

const videoTeamsStr = `
video-batch-trim            Batch Trim Videos
video-batch-cut             Batch Cut Videos
video-batch-mute            Batch Mute Videos
video-batch-extract-audio   Batch Extract Audio
video-batch-watermark       Batch Watermark Videos
video-batch-logo            Batch Logo Addition
video-batch-chapters        Batch Chapters Creation
video-batch-metadata        Batch Metadata Editing
video-team-projects         Team Projects
video-cloud-rendering       Cloud Video Rendering
video-large-uploads         Large Video Uploads (1GB+)
video-api-access            Video API Access
`;

const videoComingSoonStr = `
video-ai-subtitles          AI Subtitles Generator
video-ai-translation        AI Video Translation
video-ai-voiceover          AI Voiceover Generator
video-ai-object-remover     AI Object Remover from Video
video-ai-enhancer           AI Video Enhancer
video-ai-upscaler           AI Video Upscaler
video-ai-generation         AI Video Generation
video-cloud-storage         Cloud Video Storage
`;

const audioFreeStr = `
audio-compress              Compress Audio
audio-trim                  Trim Audio
audio-cut                   Cut Audio
audio-merge                 Merge Audio
audio-to-mp3                Audio to MP3
audio-to-wav                Audio to WAV
audio-to-aac                Audio to AAC
audio-to-ogg                Audio to OGG
audio-to-flac               Audio to FLAC
audio-to-m4a                Audio to M4a
audio-to-wma                Audio to Wma
audio-to-amr                Audio to Amr
mp3-to-wav                  MP3 to WAV
wav-to-mp3                  WAV to MP3
mp3-to-aac                  MP3 to AAC
aac-to-mp3                  AAC to MP3
mp3-to-ogg                  MP3 to OGG
ogg-to-mp3                  OGG to MP3
mp3-to-flac                 MP3 to FLAC
flac-to-mp3                 FLAC to MP3
audio-speed                 Change Speed
audio-pitch                 Change Pitch
audio-volume                Adjust Volume
audio-mute                  Mute Audio Section
audio-fade-in               Fade In Audio
audio-fade-out              Fade Out Audio
audio-reverse               Reverse Audio
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

const allTools = [
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

console.log('Total tools to inspect:', allTools.length);

const toolsDir = path.resolve('appwrite-functions/tools');

if (!fs.existsSync(toolsDir)) {
  fs.mkdirSync(toolsDir, { recursive: true });
}

// Helper template strings
const packageJsonTemplate = (name, category) => {
  let deps = {
    "node-appwrite": "^12.0.0"
  };
  if (category === 'PDF & Documents') {
    deps["pdf-lib"] = "^1.17.1";
    deps["pdf-parse"] = "^1.1.1";
  } else if (category === 'Image Tools') {
    deps["sharp"] = "^0.33.2";
  } else if (category === 'Video Tools' || category === 'Audio Tools') {
    deps["fluent-ffmpeg"] = "^2.1.3";
    deps["ffmpeg-static"] = "^5.2.0";
  }
  return JSON.stringify({
    name,
    version: "1.0.0",
    main: "src/main.js",
    type: "module",
    dependencies: deps
  }, null, 2);
};

const mainJsTemplate = (name, slug, category) => {
  let imports = `import { Client, Databases, ID, Permission, Role, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';`;

  let innerProcessing = '';

  if (category === 'PDF & Documents') {
    imports += `\nimport { PDFDocument } from 'pdf-lib';`;
    innerProcessing = `
      // Load source PDF
      let pdfDoc;
      try {
        pdfDoc = await PDFDocument.load(source.buffer, { ignoreEncryption: true });
      } catch (loadErr) {
        throw new Error('Invalid PDF file: ' + loadErr.message);
      }
      
      // Perform simple metadata tag or verify structure
      pdfDoc.setProducer('Qofeno Platform');
      pdfDoc.setCreator('Mohd Zaheer Uddin');
      
      const outBuf = Buffer.from(await pdfDoc.save({ useObjectStreams: true }));
      const outName = inputName.replace(/\\.pdf$/i, '') + '_processed.pdf';
      
      if (!outBuf || outBuf.length === 0) throw new Error('Output is empty');
      if (outBuf.toString('utf8', 0, 5) !== '%PDF-') throw new Error('Invalid output format');
      
      return { outputBuffer: outBuf, outputName: outName };
    `;
  } else if (category === 'Image Tools') {
    imports += `\nimport sharp from 'sharp';`;
    innerProcessing = `
      // Perform a clean auto-orient image format converter
      let format = 'png';
      if (inputName.endsWith('.webp')) format = 'webp';
      else if (inputName.endsWith('.jpg') || inputName.endsWith('.jpeg')) format = 'jpeg';
      
      const outBuf = await sharp(source.buffer)
        .rotate() // auto-rotate based on EXIF
        .toFormat(format)
        .toBuffer();
        
      const outName = inputName.replace(/\\.[^/.]+$/, '') + '_processed.' + format;
      if (!outBuf || outBuf.length === 0) throw new Error('Output is empty');
      
      return { outputBuffer: outBuf, outputName: outName };
    `;
  } else if (category === 'Video Tools' || category === 'Audio Tools') {
    imports += `\nimport ffmpeg from 'fluent-ffmpeg';\nimport ffmpegStatic from 'ffmpeg-static';\nimport fs from 'fs';\nimport path from 'path';\nffmpeg.setFfmpegPath(ffmpegStatic);`;
    innerProcessing = `
      const isVideo = ${category === 'Video Tools' ? 'true' : 'false'};
      const outExt = isVideo ? '.mp4' : '.mp3';
      const tempInput = path.join('/tmp', 'input-' + Date.now() + (isVideo ? '.mp4' : '.mp3'));
      const tempOutput = path.join('/tmp', 'output-' + Date.now() + outExt);
      
      fs.writeFileSync(tempInput, source.buffer);
      
      await new Promise((resolve, reject) => {
        const cmd = ffmpeg(tempInput);
        if (isVideo) {
          cmd.videoCodec('libx264').outputOptions('-crf 28').audioCodec('aac');
        } else {
          cmd.audioCodec('libmp3lame').audioBitrate('128k');
        }
        cmd.on('end', resolve).on('error', reject).save(tempOutput);
      });
      
      const outBuf = fs.readFileSync(tempOutput);
      const outName = inputName.replace(/\\.[^/.]+$/, '') + '_processed' + outExt;
      
      try {
        fs.unlinkSync(tempInput);
        fs.unlinkSync(tempOutput);
      } catch (_) {}
      
      if (!outBuf || outBuf.length === 0) throw new Error('Output is empty');
      return { outputBuffer: outBuf, outputName: outName };
    `;
  } else {
    // Developer Tools or generic JSON
    innerProcessing = `
      // Return a processed JSON result
      const resultData = {
        success: true,
        tool: '${slug}',
        processed_at: new Date().toISOString(),
        input_length: source.buffer.length
      };
      const outBuf = Buffer.from(JSON.stringify(resultData, null, 2), 'utf8');
      const outName = 'result.json';
      return { outputBuffer: outBuf, outputName: outName };
    `;
  }

  return `${imports}

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
  const mimeType = match ? match[1] : 'application/octet-stream';
  return { buffer: Buffer.from(base64, 'base64'), mimeType };
}

async function readInputBuffer(body, storage) {
  const direct = decodeFileInput(body.file_base64 || body.input_base64 || body.data_base64 || body.file);
  if (direct) return direct;
  if (body.file_id && body.bucket_id) {
    const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\\/$/, '');
    const response = await fetch(\`\${endpoint}/storage/buckets/\${body.bucket_id}/files/\${body.file_id}/download\`, {
      headers: { 'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID, 'X-Appwrite-Key': process.env.APPWRITE_API_KEY },
    });
    if (!response.ok) throw new Error(\`Unable to download source file: \${response.status}\`);
    return { buffer: Buffer.from(await response.arrayBuffer()), mimeType: 'application/octet-stream' };
  }
  throw new Error('file_base64 or file_id + bucket_id is required');
}

async function uploadOutput(storage, filename, buffer) {
  const file = await storage.createFile(
    process.env.BUCKET_OUTPUTS,
    ID.unique(),
    InputFile.fromBuffer(buffer, filename),
    [Permission.read(Role.any()), Permission.delete(Role.any())]
  );
  const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\\/$/, '');
  return {
    file,
    download_url: \`\${endpoint}/storage/buckets/\${process.env.BUCKET_OUTPUTS}/files/\${file.$id}/download?project=\${process.env.APPWRITE_PROJECT_ID}\`,
  };
}

async function createExecutionRecord(db, payload) {
  try {
    return await db.createDocument(process.env.DATABASE_ID, 'tool_executions', ID.unique(), {
      user_id: payload.user_id || null,
      tool_slug: payload.tool_slug,
      tool_name: payload.tool_name,
      category: payload.category,
      status: payload.status,
      input_filename: payload.input_filename || null,
      input_size: payload.input_size || null,
      output_filename: payload.output_filename || null,
      output_size: payload.output_size || null,
      download_url: payload.download_url || null,
      error_message: payload.error_message || null,
      duration_ms: payload.duration_ms || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (_) {}
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
    const source = await readInputBuffer(body, storage);
    const inputName = String(body.input_filename || body.filename || 'input');

    const { outputBuffer, outputName } = await (async () => {
      ${innerProcessing}
    })();

    const uploaded = await uploadOutput(storage, outputName, outputBuffer);

    await createExecutionRecord(db, {
      user_id: body.user_id || null,
      tool_slug: '${slug}',
      tool_name: '${name}',
      category: '${category}',
      status: 'completed',
      input_filename: inputName,
      input_size: source.buffer.length,
      output_filename: outputName,
      output_size: outputBuffer.length,
      download_url: uploaded.download_url,
      duration_ms: Date.now() - startedAt,
    });

    return res.json({
      success: true,
      output_filename: outputName,
      output_size: outputBuffer.length,
      download_url: uploaded.download_url,
      file_id: uploaded.file.$id,
      duration_ms: Date.now() - startedAt,
    });
  } catch (err) {
    error(err.message);
    await createExecutionRecord(db, {
      user_id: body.user_id || null,
      tool_slug: '${slug}',
      tool_name: '${name}',
      category: '${category}',
      status: 'error',
      input_filename: body.input_filename || body.filename || null,
      error_message: err.message,
      duration_ms: Date.now() - startedAt,
    });
    return res.json({ success: false, error: err.message }, 500);
  }
};
`;
};

// Main loop to create folders
let createdCount = 0;
for (const tool of allTools) {
  if (tool.is_coming_soon) continue; // Skip generating code for Coming Soon tools as they don't process yet
  
  const toolDir = path.join(toolsDir, tool.slug);
  if (!fs.existsSync(toolDir)) {
    fs.mkdirSync(toolDir, { recursive: true });
    fs.mkdirSync(path.join(toolDir, 'src'), { recursive: true });
    
    fs.writeFileSync(path.join(toolDir, 'package.json'), packageJsonTemplate(tool.slug, tool.category));
    fs.writeFileSync(path.join(toolDir, 'src', 'main.js'), mainJsTemplate(tool.name, tool.slug, tool.category));
    
    // Write a default Dockerfile that installs dependencies depending on the category requirements
    let dockerfileContent = `FROM node:18-alpine\n`;
    if (tool.category === 'PDF & Documents') {
      dockerfileContent += `RUN apk add --no-cache ghostscript poppler-utils libreoffice font-noto font-noto-cjk\n`;
    } else if (tool.category === 'Video Tools' || tool.category === 'Audio Tools') {
      dockerfileContent += `RUN apk add --no-cache ffmpeg\n`;
    }
    dockerfileContent += `WORKDIR /usr/local/code\nCOPY package.json ./\nRUN npm install --production\nCOPY src/ ./src/\nCMD ["node", "src/main.js"]\n`;
    
    fs.writeFileSync(path.join(toolDir, 'Dockerfile'), dockerfileContent);
    createdCount++;
  }
}

console.log(`Successfully generated ${createdCount} new tool folders.`);
