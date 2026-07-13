import fs from 'fs';
import path from 'path';

const mapping = {
  // Audio tools using FFmpeg
  'aac-converter': 'ffmpeg',
  'audio-compressor': 'ffmpeg',
  'audio-metadata-viewer': 'ffmpeg',
  'audio-reverser': 'ffmpeg',
  'background-noise-remover': 'ffmpeg',
  'bass-booster': 'ffmpeg',
  'change-pitch': 'ffmpeg',
  'change-speed': 'ffmpeg',
  'extract-audio': 'ffmpeg',
  'fade-in': 'ffmpeg',
  'fade-out': 'ffmpeg',
  'flac-converter': 'ffmpeg',
  'merge-audio': 'ffmpeg',
  'mp3-converter': 'ffmpeg',
  'ogg-converter': 'ffmpeg',
  'ringtone-maker': 'ffmpeg',
  'silence-remover': 'ffmpeg',
  'trim-audio': 'ffmpeg',
  'volume-booster': 'ffmpeg',
  'wav-converter': 'ffmpeg',

  // Video tools using FFmpeg
  'avi-converter': 'ffmpeg',
  'gif-maker-video': 'ffmpeg',
  'merge-videos': 'ffmpeg',
  'mov-converter': 'ffmpeg',
  'mp4-converter': 'ffmpeg',
  'remove-audio': 'ffmpeg',
  'rotate-video': 'ffmpeg',
  'speed-changer-video': 'ffmpeg',
  'video-compressor': 'ffmpeg',
  'video-trimmer': 'ffmpeg',
  'webm-converter': 'ffmpeg',

  // Ghostscript tools
  'pdf-compressor': 'ghostscript',
  'pdf-grayscale': 'ghostscript',
  'batch-compress-pdfs': 'ghostscript',

  // Poppler-utils tools
  'pdf-to-jpg': 'poppler-utils',
  'pdf-to-png': 'poppler-utils',

  // LibreOffice tools
  'pdf-to-html': 'libreoffice font-noto font-noto-cjk',
  'pdf-to-excel': 'libreoffice font-noto font-noto-cjk',
  'pdf-to-powerpoint': 'libreoffice font-noto font-noto-cjk',
  'pdf-to-word': 'libreoffice font-noto font-noto-cjk',
  'word-to-pdf': 'libreoffice font-noto font-noto-cjk',
  'excel-to-pdf': 'libreoffice font-noto font-noto-cjk',
  'powerpoint-to-pdf': 'libreoffice font-noto font-noto-cjk',
  'batch-convert-pdfs': 'libreoffice font-noto font-noto-cjk',

  // OCR tools
  'pdf-ocr': 'tesseract-ocr tesseract-ocr-data-eng',
};

async function main() {
  const toolsDir = path.join(process.cwd(), 'appwrite-functions', 'tools');
  if (!fs.existsSync(toolsDir)) {
    console.error(`Tools directory not found: ${toolsDir}`);
    process.exit(1);
  }

  const dirs = fs.readdirSync(toolsDir).filter(f => fs.statSync(path.join(toolsDir, f)).isDirectory());

  let count = 0;
  for (const dir of dirs) {
    const packages = mapping[dir];
    if (packages) {
      const dockerfileContent = `FROM node:18-alpine

RUN apk add --no-cache \\
    ${packages.split(' ').join(' \\\n    ')}

WORKDIR /usr/local/code
COPY package.json ./
RUN npm install --production
COPY src/ ./src/
CMD ["node", "src/main.js"]
`;

      const destPath = path.join(toolsDir, dir, 'Dockerfile');
      fs.writeFileSync(destPath, dockerfileContent, 'utf8');
      console.log(`Created Dockerfile for ${dir}`);
      count++;
    }
  }

  console.log(`Generated custom Dockerfiles for ${count} functions.`);
}

main().catch(console.error);
