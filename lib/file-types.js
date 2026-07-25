// lib/file-types.js — source of truth for ALL file type handling
export const FILE_TYPES = {
  // ─── PDF ──────────────────────────────────────────────────────
  pdf: {
    mime: "application/pdf",
    extensions: [".pdf"],
    maxSizeFree: 52428800,    // 50MB
    maxSizePro:  524288000,   // 500MB
    maxSizeTeams: 1073741824, // 1GB
    magicBytes: { offset: 0, value: "%PDF" }
  },

  // ─── DOCUMENTS ────────────────────────────────────────────────
  docx: {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extensions: [".docx"],
    magicBytes: { offset: 0, hex: "504B" }  // ZIP-based
  },
  doc: {
    mime: "application/msword",
    extensions: [".doc"],
    magicBytes: { offset: 0, hex: "D0CF" }  // OLE compound
  },
  xlsx: {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extensions: [".xlsx"],
    magicBytes: { offset: 0, hex: "504B" }
  },
  xls: {
    mime: "application/vnd.ms-excel",
    extensions: [".xls"],
    magicBytes: { offset: 0, hex: "D0CF" }
  },
  pptx: {
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    extensions: [".pptx"],
    magicBytes: { offset: 0, hex: "504B" }
  },
  ppt: {
    mime: "application/vnd.ms-powerpoint",
    extensions: [".ppt"],
    magicBytes: { offset: 0, hex: "D0CF" }
  },
  odt: {
    mime: "application/vnd.oasis.opendocument.text",
    extensions: [".odt"],
    magicBytes: { offset: 0, hex: "504B" }
  },
  rtf: {
    mime: "application/rtf",
    extensions: [".rtf"],
    magicBytes: { offset: 0, value: "{\\rt" }
  },
  epub: {
    mime: "application/epub+zip",
    extensions: [".epub"],
    magicBytes: { offset: 0, hex: "504B" }
  },
  txt: {
    mime: "text/plain",
    extensions: [".txt", ".text", ".md", ".markdown", ".csv", ".json", ".xml", ".yaml", ".yml"]
  },
  html: {
    mime: "text/html",
    extensions: [".html", ".htm"]
  },

  // ─── IMAGES ───────────────────────────────────────────────────
  jpg: {
    mime: "image/jpeg",
    extensions: [".jpg", ".jpeg", ".jpe", ".jfif"],
    magicBytes: { offset: 0, hex: "FFD8FF" }
  },
  png: {
    mime: "image/png",
    extensions: [".png"],
    magicBytes: { offset: 0, hex: "89504E47" }
  },
  webp: {
    mime: "image/webp",
    extensions: [".webp"],
    magicBytes: { offset: 8, value: "WEBP" }
  },
  gif: {
    mime: "image/gif",
    extensions: [".gif"],
    magicBytes: { offset: 0, value: "GIF" }
  },
  bmp: {
    mime: "image/bmp",
    extensions: [".bmp"],
    magicBytes: { offset: 0, hex: "424D" }
  },
  tiff: {
    mime: "image/tiff",
    extensions: [".tif", ".tiff"],
    magicBytes: { offset: 0, hex: "4949" }  // II (little endian) or MM (big endian)
  },
  avif: {
    mime: "image/avif",
    extensions: [".avif"]
  },
  heic: {
    mime: "image/heic",
    extensions: [".heic", ".heif"]
  },
  svg: {
    mime: "image/svg+xml",
    extensions: [".svg"]
  },
  ico: {
    mime: "image/x-icon",
    extensions: [".ico"]
  },
  psd: {
    mime: "image/vnd.adobe.photoshop",
    extensions: [".psd"],
    magicBytes: { offset: 0, hex: "38425053" }
  },
  raw: {
    mime: "image/x-raw",
    extensions: [".raw", ".cr2", ".nef", ".arw", ".dng"]
  },

  // ─── VIDEO ────────────────────────────────────────────────────
  mp4: {
    mime: "video/mp4",
    extensions: [".mp4", ".m4v"],
    magicBytes: { offset: 4, value: "ftyp" }
  },
  mov: {
    mime: "video/quicktime",
    extensions: [".mov", ".qt"]
  },
  avi: {
    mime: "video/x-msvideo",
    extensions: [".avi"],
    magicBytes: { offset: 0, value: "RIFF" }
  },
  mkv: {
    mime: "video/x-matroska",
    extensions: [".mkv", ".mk3d"],
    magicBytes: { offset: 0, hex: "1A45DFA3" }
  },
  webm: {
    mime: "video/webm",
    extensions: [".webm"],
    magicBytes: { offset: 0, hex: "1A45DFA3" }
  },
  flv: {
    mime: "video/x-flv",
    extensions: [".flv"],
    magicBytes: { offset: 0, value: "FLV" }
  },
  wmv: {
    mime: "video/x-ms-wmv",
    extensions: [".wmv", ".wma"]
  },
  mpeg: {
    mime: "video/mpeg",
    extensions: [".mpeg", ".mpg", ".mpe"]
  },
  "3gp": {
    mime: "video/3gpp",
    extensions: [".3gp", ".3g2"]
  },
  ogv: {
    mime: "video/ogg",
    extensions: [".ogv", ".ogg"]
  },

  // ─── AUDIO ────────────────────────────────────────────────────
  mp3: {
    mime: "audio/mpeg",
    extensions: [".mp3"],
    magicBytes: { offset: 0, hex: "FF" }  // sync word
  },
  wav: {
    mime: "audio/wav",
    extensions: [".wav"],
    magicBytes: { offset: 0, value: "RIFF" }
  },
  flac: {
    mime: "audio/flac",
    extensions: [".flac"],
    magicBytes: { offset: 0, value: "fLaC" }
  },
  aac: {
    mime: "audio/aac",
    extensions: [".aac", ".m4a", ".m4b"]
  },
  ogg: {
    mime: "audio/ogg",
    extensions: [".ogg", ".oga", ".ogx"],
    magicBytes: { offset: 0, value: "OggS" }
  },
  opus: {
    mime: "audio/opus",
    extensions: [".opus"]
  },
  wma: {
    mime: "audio/x-ms-wma",
    extensions: [".wma"]
  },
  aiff: {
    mime: "audio/aiff",
    extensions: [".aif", ".aiff"],
    magicBytes: { offset: 0, value: "FORM" }
  },
  amr: {
    mime: "audio/amr",
    extensions: [".amr"]
  },

  // ─── DATA ─────────────────────────────────────────────────────
  csv: {
    mime: "text/csv",
    extensions: [".csv"]
  },
  json: {
    mime: "application/json",
    extensions: [".json"]
  },
  xml: {
    mime: "application/xml",
    extensions: [".xml", ".xsl", ".xsd"]
  },
  yaml: {
    mime: "application/yaml",
    extensions: [".yaml", ".yml"]
  },
  zip: {
    mime: "application/zip",
    extensions: [".zip"],
    magicBytes: { offset: 0, hex: "504B" }
  },
}

// Get MIME type from file bytes (NOT from Content-Type header — always spoof-proof)
export function detectMimeFromBytes(buffer) {
  const buf = Buffer.from(buffer)
  const hex4  = buf.slice(0, 4).toString("hex").toUpperCase()
  const ascii4 = buf.slice(0, 4).toString("ascii")
  const ascii8 = buf.slice(4, 8).toString("ascii")

  if (ascii4 === "%PDF") return "application/pdf"
  if (hex4 === "FFD8FF") return "image/jpeg"
  if (hex4 === "89504E47") return "image/png"
  if (buf.slice(8, 12).toString("ascii") === "WEBP") return "image/webp"
  if (ascii4.startsWith("GIF")) return "image/gif"
  if (hex4 === "424D") return "image/bmp"
  if (hex4 === "4949" || hex4 === "4D4D") return "image/tiff"
  if (hex4 === "38425053") return "image/vnd.adobe.photoshop"
  if (hex4 === "504B0304") {
    // ZIP-based: could be DOCX, XLSX, PPTX, ODT, EPUB
    return "application/zip"
  }
  if (hex4 === "D0CF11E0") return "application/msword"
  if (ascii4 === "RIFF") {
    if (buf.slice(8, 12).toString("ascii") === "AVI ") return "video/x-msvideo"
    if (buf.slice(8, 12).toString("ascii") === "WAVE") return "audio/wav"
    return "application/octet-stream"
  }
  if (ascii4 === "fLaC") return "audio/flac"
  if (ascii4 === "OggS") return "audio/ogg"
  if (ascii4 === "FORM") return "audio/aiff"
  if (hex4.startsWith("1A45") && buf[1] === 0x45) return "video/x-matroska"
  if (ascii8 === "ftyp") return "video/mp4"
  if (ascii4 === "FLV\x01") return "video/x-flv"
  if ((buf[0] === 0xFF) && ((buf[1] & 0xE0) === 0xE0)) return "audio/mpeg"
  return "application/octet-stream"
}

// Validate that input mime matches what the tool accepts
export function validateInputType(detectedMime, acceptedMimes) {
  if (!acceptedMimes || !acceptedMimes.length) return true;
  // Normalize: application/zip covers docx, xlsx, pptx, odt, epub
  const zipTypes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/epub+zip",
    "application/vnd.oasis.opendocument.text"
  ]
  if (detectedMime === "application/zip" && acceptedMimes.some(m => zipTypes.includes(m))) {
    return true  // Accept — we'll verify further during processing
  }
  // image/jpeg covers jfif, jpe etc.
  if (detectedMime === "image/jpeg" && acceptedMimes.includes("image/jpeg")) return true

  return acceptedMimes.includes(detectedMime)
}
