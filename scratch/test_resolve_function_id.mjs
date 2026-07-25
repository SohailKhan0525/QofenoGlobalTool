function resolveGroupedFunctionId(toolSlug, category) {
  const slug = (toolSlug || '').toLowerCase();
  const cat = (category || '').toLowerCase();

  // 1. Security & Web
  if (slug.includes('password') || slug.includes('qr') || slug.includes('barcode') || slug.includes('encrypt') || slug.includes('decrypt') || slug.includes('security') || cat.includes('security')) {
    return 'qofeno-security';
  }

  // 2. Developer Tools
  if (slug.includes('json') || slug.includes('base64') || slug.includes('xml') || slug.includes('yaml') || slug.includes('sql') || slug.includes('formatter') || slug.includes('minifier') || slug.includes('jwt') || slug.includes('uuid') || slug.includes('hash') || cat.includes('developer')) {
    return 'qofeno-developer';
  }

  // 3. Text Tools
  if (slug.includes('word-counter') || slug.includes('character-counter') || slug.includes('paragraph-counter') || slug.includes('text') || slug.includes('syllable') || slug.includes('readability') || slug.includes('diff') || cat.includes('text')) {
    return 'qofeno-text';
  }

  // 4. Data Tools
  if (slug.includes('csv') || slug.includes('xlsx') || slug.includes('xls') || slug.includes('data') || slug.includes('chart') || slug.includes('table') || cat.includes('data')) {
    return 'qofeno-data';
  }

  // 5. Image Tools
  if (slug.includes('image') || slug.match(/(jpg|png|webp|avif|heic|bmp|tiff|svg|ico|raw|psd|resize|crop-image|blur-image|sharpen-image|brightness|contrast|flip-image|rotate-image|watermark-image)/) || cat.includes('image')) {
    return 'qofeno-image';
  }

  // 6. Video Tools
  if (slug.includes('video') || slug.match(/(mp4|mov|avi|webm|mkv|flv|wmv|3gp|trim-video|crop-video|compress-video|merge-video|rotate-video|flip-video|extract-audio|remove-audio|speed-changer-video|reverse-video|loop-video|gif-maker-video|thumbnail-extractor)/) || cat.includes('video')) {
    return 'qofeno-video';
  }

  // 7. Audio Tools
  if (slug.includes('audio') || slug.match(/(mp3|wav|ogg|flac|aac|opus|wma|aiff|amr|trim-audio|merge-audio|volume-booster|change-audio|fade-in-audio|fade-out-audio|silence-remover|audio-reverser|ringtone-maker|bass-booster|background-noise-remover)/) || cat.includes('audio')) {
    return 'qofeno-audio';
  }

  // 8. PDF Tools (Default)
  return 'qofeno-pdf';
}

console.log('pdf-compressor ->', resolveGroupedFunctionId('pdf-compressor'));
console.log('image-resizer ->', resolveGroupedFunctionId('image-resizer'));
console.log('video-compressor ->', resolveGroupedFunctionId('video-compressor'));
console.log('trim-audio ->', resolveGroupedFunctionId('trim-audio'));
console.log('word-counter ->', resolveGroupedFunctionId('word-counter'));
console.log('json-formatter ->', resolveGroupedFunctionId('json-formatter'));
console.log('password-generator ->', resolveGroupedFunctionId('password-generator'));
