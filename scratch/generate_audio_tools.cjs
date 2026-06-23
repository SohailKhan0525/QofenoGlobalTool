const fs = require('fs');
const path = require('path');

const audioTools = [
  { id: 'mp3-converter', slug: 'mp3-converter', name: 'MP3 Converter', desc: 'Convert audio files to MP3 format.', icon: 'faMusic' },
  { id: 'wav-converter', slug: 'wav-converter', name: 'WAV Converter', desc: 'Convert audio files to WAV format.', icon: 'faMusic' },
  { id: 'aac-converter', slug: 'aac-converter', name: 'AAC Converter', desc: 'Convert audio files to AAC format.', icon: 'faMusic' },
  { id: 'ogg-converter', slug: 'ogg-converter', name: 'OGG Converter', desc: 'Convert audio files to OGG format.', icon: 'faMusic' },
  { id: 'flac-converter', slug: 'flac-converter', name: 'FLAC Converter', desc: 'Convert audio files to FLAC format.', icon: 'faMusic' },
  { id: 'trim-audio', slug: 'trim-audio', name: 'Trim Audio', desc: 'Cut and trim audio files.', icon: 'faMusic' },
  { id: 'merge-audio', slug: 'merge-audio', name: 'Merge Audio', desc: 'Combine multiple audio files into one.', icon: 'faMusic' },
  { id: 'audio-compressor', slug: 'audio-compressor', name: 'Audio Compressor', desc: 'Compress audio files to save space.', icon: 'faMusic' },
  { id: 'volume-booster', slug: 'volume-booster', name: 'Volume Booster', desc: 'Increase the volume of your audio.', icon: 'faVolumeHigh' },
  { id: 'change-audio-speed', slug: 'change-audio-speed', name: 'Change Audio Speed', desc: 'Speed up or slow down audio.', icon: 'faTachometerAlt' },
  { id: 'change-audio-pitch', slug: 'change-audio-pitch', name: 'Change Audio Pitch', desc: 'Change the pitch of your audio.', icon: 'faMusic' },
  { id: 'fade-in-audio', slug: 'fade-in-audio', name: 'Fade In Audio', desc: 'Add a fade in effect to audio.', icon: 'faMusic' },
  { id: 'fade-out-audio', slug: 'fade-out-audio', name: 'Fade Out Audio', desc: 'Add a fade out effect to audio.', icon: 'faMusic' },
  { id: 'silence-remover', slug: 'silence-remover', name: 'Silence Remover', desc: 'Remove silent parts from audio.', icon: 'faVolumeXmark' },
  { id: 'audio-reverser', slug: 'audio-reverser', name: 'Audio Reverser', desc: 'Play your audio backwards.', icon: 'faBackward' },
  { id: 'audio-metadata', slug: 'audio-metadata', name: 'Audio Metadata', desc: 'View and edit audio metadata.', icon: 'faFileLines' },
  { id: 'ringtone-maker', slug: 'ringtone-maker', name: 'Ringtone Maker', desc: 'Create a ringtone from audio.', icon: 'faMusic' },
  { id: 'bass-booster', slug: 'bass-booster', name: 'Bass Booster', desc: 'Boost the bass in your audio.', icon: 'faMusic' },
  { id: 'background-noise-remover', slug: 'background-noise-remover', name: 'Background Noise Remover', desc: 'Clean up audio and remove noise.', icon: 'faWandMagicSparkles' }
];

let catalogStr = '';
for (const tool of audioTools) {
  catalogStr += `  {
    id: '${tool.id}',
    slug: '${tool.slug}',
    name: '${tool.name}',
    category: 'Audio',
    subcategory: 'Audio Tools',
    type: 'Free',
    isNew: true,
    isPopular: false,
    runs: '0',
    desc: '${tool.desc}',
    icon: ${tool.icon},
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: '${tool.name}',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: '${tool.desc}',
    }),
    functionId: FUNCTION_IDS.audioManipulator,
  },\n`;
}

const catalogPath = path.join(__dirname, '../src/lib/toolCatalog.ts');
let content = fs.readFileSync(catalogPath, 'utf8');

// Ensure the replace regex ONLY replaces the one inside the import statement
content = content.replace(/import {([^}]+)} from '@fortawesome\/free-solid-svg-icons';/, (match, p1) => {
  if (!p1.includes('faVolumeHigh')) {
    return `import {${p1}, faVolumeHigh} from '@fortawesome/free-solid-svg-icons';`;
  }
  return match;
});

// Insert before the END of the FALLBACK_TOOLS array
// The array ends with "];\n\nconst FALLBACK_TOOL_LOOKUP"
content = content.replace(/\n];\n\nconst FALLBACK_TOOL_LOOKUP/, ',\n' + catalogStr + '];\n\nconst FALLBACK_TOOL_LOOKUP');

fs.writeFileSync(catalogPath, content, 'utf8');
console.log('Appended 19 audio tools to toolCatalog.ts');
