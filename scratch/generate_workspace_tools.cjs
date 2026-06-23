const fs = require('fs');
const path = require('path');

const audioTools = [
  { id: 'mp3-converter', name: 'MP3 Converter', helper: 'Convert audio to MP3.', icon: 'faMusic', accept: 'audio/*', multiple: false, action: 'convert', format: 'mp3' },
  { id: 'wav-converter', name: 'WAV Converter', helper: 'Convert audio to WAV.', icon: 'faMusic', accept: 'audio/*', multiple: false, action: 'convert', format: 'wav' },
  { id: 'aac-converter', name: 'AAC Converter', helper: 'Convert audio to AAC.', icon: 'faMusic', accept: 'audio/*', multiple: false, action: 'convert', format: 'aac' },
  { id: 'ogg-converter', name: 'OGG Converter', helper: 'Convert audio to OGG.', icon: 'faMusic', accept: 'audio/*', multiple: false, action: 'convert', format: 'ogg' },
  { id: 'flac-converter', name: 'FLAC Converter', helper: 'Convert audio to FLAC.', icon: 'faMusic', accept: 'audio/*', multiple: false, action: 'convert', format: 'flac' },
  { id: 'trim-audio', name: 'Trim Audio', helper: 'Cut and trim audio files.', icon: 'faMusic', accept: 'audio/*', multiple: false, action: 'trim', fields: [{type: 'text', key: 'start_time', label: 'Start Time (HH:MM:SS)', defaultValue: '00:00:00'}, {type: 'text', key: 'end_time', label: 'End Time / Duration', defaultValue: '00:00:10'}] },
  { id: 'merge-audio', name: 'Merge Audio', helper: 'Combine multiple audio files into one.', icon: 'faMusic', accept: 'audio/*', multiple: true, action: 'merge' },
  { id: 'audio-compressor', name: 'Audio Compressor', helper: 'Compress audio files to save space.', icon: 'faMusic', accept: 'audio/*', multiple: false, action: 'compress' },
  { id: 'volume-booster', name: 'Volume Booster', helper: 'Increase the volume of your audio.', icon: 'faVolumeHigh', accept: 'audio/*', multiple: false, action: 'volume-boost', fields: [{type: 'number', key: 'volume', label: 'Volume Multiplier', defaultValue: '2.0'}] },
  { id: 'change-audio-speed', name: 'Change Audio Speed', helper: 'Speed up or slow down audio.', icon: 'faTachometerAlt', accept: 'audio/*', multiple: false, action: 'speed', fields: [{type: 'number', key: 'speed', label: 'Speed Multiplier (e.g., 1.5, 0.5)', defaultValue: '1.5'}] },
  { id: 'change-audio-pitch', name: 'Change Audio Pitch', helper: 'Change the pitch of your audio.', icon: 'faMusic', accept: 'audio/*', multiple: false, action: 'pitch', fields: [{type: 'number', key: 'pitch', label: 'Pitch Ratio (e.g., 1.2 for higher, 0.8 for lower)', defaultValue: '1.2'}] },
  { id: 'fade-in-audio', name: 'Fade In Audio', helper: 'Add a fade in effect to audio.', icon: 'faMusic', accept: 'audio/*', multiple: false, action: 'fade-in', fields: [{type: 'number', key: 'duration', label: 'Fade In Duration (seconds)', defaultValue: '3'}] },
  { id: 'fade-out-audio', name: 'Fade Out Audio', helper: 'Add a fade out effect to audio.', icon: 'faMusic', accept: 'audio/*', multiple: false, action: 'fade-out', fields: [{type: 'number', key: 'start_time', label: 'Start Time (seconds)', defaultValue: '10'}, {type: 'number', key: 'duration', label: 'Fade Out Duration (seconds)', defaultValue: '3'}] },
  { id: 'silence-remover', name: 'Silence Remover', helper: 'Remove silent parts from audio.', icon: 'faVolumeXmark', accept: 'audio/*', multiple: false, action: 'silence-remove' },
  { id: 'audio-reverser', name: 'Audio Reverser', helper: 'Play your audio backwards.', icon: 'faBackward', accept: 'audio/*', multiple: false, action: 'reverse' },
  { id: 'audio-metadata', name: 'Audio Metadata', helper: 'Extract audio metadata to JSON.', icon: 'faFileLines', accept: 'audio/*', multiple: false, action: 'metadata' },
  { id: 'ringtone-maker', name: 'Ringtone Maker', helper: 'Create a ringtone from audio.', icon: 'faMusic', accept: 'audio/*', multiple: false, action: 'ringtone', fields: [{type: 'text', key: 'start_time', label: 'Start Time (HH:MM:SS)', defaultValue: '00:00:00'}, {type: 'number', key: 'duration', label: 'Duration (seconds)', defaultValue: '30'}] },
  { id: 'bass-booster', name: 'Bass Booster', helper: 'Boost the bass in your audio.', icon: 'faMusic', accept: 'audio/*', multiple: false, action: 'bass-boost', fields: [{type: 'number', key: 'gain', label: 'Gain (dB)', defaultValue: '5'}] },
  { id: 'background-noise-remover', name: 'Background Noise Remover', helper: 'Clean up audio and remove noise.', icon: 'faWandMagicSparkles', accept: 'audio/*', multiple: false, action: 'noise-remove' }
];

let slugsToAdd = '';
let configStrs = '';

for (const tool of audioTools) {
  slugsToAdd += `  '${tool.id}',\n`;
  
  let fieldsStr = `      { type: 'text', key: 'action', label: '', defaultValue: '${tool.action}', hide: true },\n`;
  if (tool.format) {
    fieldsStr += `      { type: 'text', key: 'format', label: '', defaultValue: '${tool.format}', hide: true },\n`;
  }
  if (tool.fields) {
    for (const field of tool.fields) {
      fieldsStr += `      { type: '${field.type}', key: '${field.key}', label: '${field.label}', defaultValue: '${field.defaultValue}' },\n`;
    }
  }

  configStrs += `  '${tool.id}': {
    icon: ${tool.icon}, accept: '${tool.accept}', multiple: ${tool.multiple},
    helper: '${tool.helper}', description: '${tool.name}.', processLabel: 'Process Audio', functionId: FUNCTION_IDS.audioManipulator,
    fields: [
${fieldsStr.trimEnd()}
    ],
  },\n`;
}

const filePath = path.join(__dirname, '../src/components/Pages/FileToolWorkspace.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('faVolumeHigh')) {
  content = content.replace(/faWandMagicSparkles } from '@fortawesome\/free-solid-svg-icons';/, 'faWandMagicSparkles, faVolumeHigh } from \'@fortawesome/free-solid-svg-icons\';');
  // fallback if it has other imports
  content = content.replace(/faWandMagicSparkles,/, 'faWandMagicSparkles, faVolumeHigh,');
}

// Ensure the replace regex ONLY replaces the one inside the import statement
content = content.replace(/import {([^}]+)} from '@fortawesome\/free-solid-svg-icons';/, (match, p1) => {
  if (!p1.includes('faVolumeHigh')) {
    return `import {${p1}, faVolumeHigh} from '@fortawesome/free-solid-svg-icons';`;
  }
  return match;
});

// Remove any accidentally injected faVolumeHigh properties in tool configs from previous runs (if they existed, but I reverted the file so it's clean)

// Add slugs
const setEndIndex = content.indexOf(']);', content.indexOf('FILE_TOOL_SLUGS ='));
if (setEndIndex !== -1) {
  content = content.slice(0, setEndIndex) + slugsToAdd + content.slice(setEndIndex);
} else {
  console.error("Could not find end of FILE_TOOL_SLUGS");
}

// Add configs
const configEndIndex = content.lastIndexOf('};', content.indexOf('function humanFileSize'));
if (configEndIndex !== -1) {
  content = content.slice(0, configEndIndex) + configStrs + content.slice(configEndIndex);
} else {
  console.error("Could not find end of ToolConfigMap");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Appended 19 workspace tools");
