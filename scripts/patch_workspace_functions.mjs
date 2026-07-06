/**
 * patch_workspace_functions.mjs
 * Updates FileToolWorkspace.tsx to use individual function IDs 
 * for each audio/video/image tool instead of the old manipulator functions.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspacePath = path.join(__dirname, '..', 'src', 'components', 'Pages', 'FileToolWorkspace.tsx');

let content = fs.readFileSync(workspacePath, 'utf8');

// Map of tool slug => FUNCTION_IDS key to use
const toolFunctionMap = {
  // Audio tools - each has its own deployed function
  'mp3-converter':           'mp3Converter',
  'wav-converter':           'wavConverter',
  'aac-converter':           'aacConverter',
  'ogg-converter':           'oggConverter',
  'flac-converter':          'flacConverter',
  'trim-audio':              'trimAudio',
  'merge-audio':             'mergeAudio',
  'audio-compressor':        'audioCompressor',
  'volume-booster':          'volumeBooster',
  'change-speed':            'changeSpeed',
  'change-audio-speed':      'changeSpeed',
  'change-pitch':            'changePitch',
  'change-audio-pitch':      'changePitch',
  'fade-in':                 'fadeIn',
  'fade-in-audio':           'fadeIn',
  'fade-out':                'fadeOut',
  'fade-out-audio':          'fadeOut',
  'silence-remover':         'silenceRemover',
  'audio-reverser':          'audioReverser',
  'audio-metadata-viewer':   'audioMetadataViewer',
  'audio-metadata':          'audioMetadataViewer',
  'ringtone-maker':          'ringtoneMaker',
  'bass-booster':            'bassBooster',
  'background-noise-remover':'backgroundNoiseRemover',
  
  // Image tools - each has its own deployed function
  'blur-image':              'blurImage',
  'brightness-adjust':       'brightnessAdjust',
  'contrast-adjust':         'contrastAdjust',
  'crop-image':              'cropImage',
  'flip-image':              'flipImage',
  'gif-maker-video':         'gifMakerVideo',
  'rotate-image':            'rotateImage',
  'sharpen-image':           'sharpenImage',
  'watermark-image':         'watermarkImage',
  'jpg-to-png':              'imageConverter',
  'png-to-webp':             'imageConverter',
  
  // Video tools - each has its own deployed function  
  'extract-audio':           'extractAudio',
  'merge-videos':            'mergeVideos',
  'mov-converter':           'movConverter',
  'mp4-converter':           'mp4Converter',
  'avi-converter':           'aviConverter',
  'webm-converter':          'webmConverter',
  'remove-audio':            'removeAudio',
  'rotate-video':            'rotateVideo',
  'speed-changer-video':     'speedChangerVideo',
};

// Replace old manipulator references with individual function IDs
// Pattern: functionId: FUNCTION_IDS.audioManipulator → functionId: FUNCTION_IDS.aacConverter
// But we need to be precise - find the config block for each tool and update

let patchedCount = 0;

for (const [slug, fnId] of Object.entries(toolFunctionMap)) {
  // Find the tool config block and replace its functionId
  // Look for: 'slug': { ... functionId: FUNCTION_IDS.someOldId, ...
  // The pattern: the slug entry followed by functionId: FUNCTION_IDS.anything
  
  const slugPattern = `'${slug}': {`;
  const slugIndex = content.indexOf(slugPattern);
  if (slugIndex === -1) {
    console.log(`NOT FOUND: ${slug}`);
    continue;
  }
  
  // Find the functionId line within this block (search forward from slugIndex)
  const blockEnd = content.indexOf('\n  },', slugIndex);
  const blockContent = content.substring(slugIndex, blockEnd > 0 ? blockEnd : slugIndex + 800);
  
  // Replace functionId: FUNCTION_IDS.xxx with functionId: FUNCTION_IDS.fnId
  const oldFnIdMatch = blockContent.match(/functionId:\s*FUNCTION_IDS\.(\w+)/);
  if (!oldFnIdMatch) {
    console.log(`NO_FUNCTION_ID: ${slug}`);
    continue;
  }
  
  const oldFnId = oldFnIdMatch[1];
  if (oldFnId === fnId) {
    console.log(`ALREADY_CORRECT: ${slug} → ${fnId}`);
    continue;
  }
  
  // Replace within the block
  const oldText = `functionId: FUNCTION_IDS.${oldFnId}`;
  const newText = `functionId: FUNCTION_IDS.${fnId}`;
  
  // Replace only the first occurrence in the block area
  const beforeBlock = content.substring(0, slugIndex);
  const afterBlock = content.substring(slugIndex);
  content = beforeBlock + afterBlock.replace(oldText, newText);
  
  console.log(`PATCHED: ${slug} | ${oldFnId} → ${fnId}`);
  patchedCount++;
}

fs.writeFileSync(workspacePath, content, 'utf8');
console.log(`\n=== DONE: Patched ${patchedCount} tool configs ===`);
