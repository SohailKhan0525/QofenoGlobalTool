#!/usr/bin/env node
/**
 * fix-ffmpeg-imports.mjs
 * Removes ffmpeg-static import from all video/audio handlers
 * and replaces with system ffmpeg path setup using fluent-ffmpeg directly.
 * System ffmpeg is installed via Dockerfile at /usr/bin/ffmpeg
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const targets = [
  path.join(root, 'functions', 'qofeno-video', 'src', 'handlers'),
  path.join(root, 'functions', 'qofeno-audio', 'src', 'handlers'),
];

let fixed = 0;
let skipped = 0;

for (const dir of targets) {
  if (!fs.existsSync(dir)) { console.log(`Skipping missing dir: ${dir}`); continue; }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if it has ffmpeg-static import
    if (!content.includes('ffmpeg-static')) { skipped++; continue; }

    // Replace the import + setFfmpegPath pattern:
    // import ffmpegStatic from 'ffmpeg-static';
    // ffmpeg.setFfmpegPath(ffmpegStatic);
    // With nothing (system ffmpeg is on PATH from Dockerfile)
    content = content
      .replace(/^import ffmpegStatic from ['"]ffmpeg-static['"];?\r?\n/gm, '')
      .replace(/^import ffmpegStatic from ['"]ffmpeg-static['"];?/gm, '')
      .replace(/ffmpeg\.setFfmpegPath\(ffmpegStatic\);?\r?\n/gm, '')
      .replace(/ffmpeg\.setFfmpegPath\(ffmpegStatic\);?/g, '');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed: ${path.relative(root, filePath)}`);
    fixed++;
  }
}

console.log(`\nFixed ${fixed} files, skipped ${skipped} (no ffmpeg-static import).`);
