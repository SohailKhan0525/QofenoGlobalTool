import fs from 'fs';
import path from 'path';

const TOOLS_DIR = path.resolve('appwrite-functions', 'tools');
const FUNCTIONS_ROOT = path.resolve('functions');

if (!fs.existsSync(TOOLS_DIR)) {
  console.error(`Tools directory not found: ${TOOLS_DIR}`);
  process.exit(1);
}

const tools = fs.readdirSync(TOOLS_DIR).filter(f => fs.statSync(path.join(TOOLS_DIR, f)).isDirectory());
console.log(`Found ${tools.length} tool folders to copy.`);

function getCategoryForSlug(slug) {
  // PDF
  if (
    slug.includes('pdf') || 
    slug.includes('word') || 
    slug.includes('excel') || 
    slug.includes('powerpoint') || 
    slug.includes('booklet') || 
    slug.includes('flatten') || 
    slug.includes('reorder') || 
    slug.includes('repair') || 
    slug.includes('crop') || 
    slug.includes('sign') || 
    slug.includes('metadata') || 
    slug.includes('grayscale') || 
    slug.includes('extract') || 
    slug.includes('delete') || 
    slug.includes('form') || 
    slug.includes('portfolio') || 
    slug.includes('compressor') || 
    slug.includes('merger') || 
    slug.includes('splitter') || 
    slug.includes('watermark') || 
    slug.includes('protect') || 
    slug.includes('ocr') || 
    slug.includes('unlock') || 
    slug.includes('thumbnail') ||
    slug.match(/^(epub-to|doc-to|html-to|odt-to|ppt-to|rtf-to|svg-to|txt-to|xml-to|png-to-pdf|webp-to-pdf)/)
  ) {
    return 'qofeno-pdf';
  }

  // Image
  if (
    slug.includes('image') || 
    slug.match(/(jpg|png|webp|avif|bmp|gif|svg|ico|heic|tiff|collage|palette)/) ||
    ['blur-image', 'brightness-adjust', 'contrast-adjust', 'crop-image', 'flip-image', 'rotate-image', 'sharpen-image', 'watermark-image'].includes(slug)
  ) {
    // Exclude gif maker video which goes to video, extract audio which goes to audio
    if (slug === 'gif-maker-video' || slug === 'extract-audio') {
      // let it fall through
    } else {
      return 'qofeno-image';
    }
  }

  // Video
  if (
    slug.includes('video') || 
    slug.match(/(mp4|mov|avi|webm|mkv|gif-maker)/) ||
    ['merge-videos', 'rotate-video', 'speed-changer-video', 'trimmer'].includes(slug)
  ) {
    return 'qofeno-video';
  }

  // Audio
  if (
    slug.includes('audio') || 
    slug.match(/(mp3|wav|ogg|flac|aac|volume|pitch|bass|silence|fade|ringtone|m4a|wma|amr|vocal|tempo|bpm|reverb|echo)/) ||
    ['merge-audio', 'trim-audio', 'volume-booster', 'background-noise-remover', 'bass-booster', 'change-pitch', 'change-speed', 'extract-audio', 'fade-in', 'fade-out', 'silence-remover', 'ringtone-maker'].includes(slug)
  ) {
    return 'qofeno-audio';
  }

  // Developer
  if (
    slug.includes('json') || 
    slug.includes('base64') || 
    slug.includes('xml') || 
    slug.includes('yaml') || 
    slug.includes('sql') || 
    slug.includes('prettier') || 
    slug.includes('minify') || 
    slug.includes('regex') || 
    slug.includes('uuid') || 
    slug.includes('cron') || 
    slug.includes('user-agent')
  ) {
    return 'qofeno-developer';
  }

  // Text
  if (
    slug.includes('text') || 
    slug.includes('case') || 
    slug.includes('markdown') || 
    slug.includes('diff') || 
    slug.includes('spell') || 
    slug.includes('translate') || 
    slug.includes('lorem') ||
    slug === 'word-counter'
  ) {
    return 'qofeno-text';
  }

  // Data
  if (
    slug.includes('data') || 
    slug.includes('csv') || 
    slug.includes('tsv') || 
    slug.includes('xlsx') || 
    slug.includes('chart') || 
    slug.includes('graph')
  ) {
    return 'qofeno-data';
  }

  // Default to security
  return 'qofeno-security';
}

function main() {
  let copiedCount = 0;
  for (const slug of tools) {
    const srcFile = path.join(TOOLS_DIR, slug, 'src', 'main.js');
    if (!fs.existsSync(srcFile)) continue;

    const cat = getCategoryForSlug(slug);
    const destDir = path.join(FUNCTIONS_ROOT, cat, 'src', 'handlers');
    const destFile = path.join(destDir, `${slug}.js`);

    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(srcFile, destFile);
    copiedCount++;
  }
  console.log(`Successfully copied ${copiedCount} handler files to their categories!`);
}

main();
