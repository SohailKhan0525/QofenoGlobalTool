import fs from 'fs';
import path from 'path';

const FUNCTIONS_ROOT = path.resolve('functions');

const CATEGORIES = [
  'qofeno-pdf',
  'qofeno-image',
  'qofeno-video',
  'qofeno-audio',
  'qofeno-text',
  'qofeno-developer',
  'qofeno-data',
  'qofeno-security'
];

const PACKAGES = {
  'qofeno-pdf': {
    "name": "qofeno-pdf",
    "version": "1.0.0",
    "type": "module",
    "dependencies": {
      "node-appwrite": "^26.2.0",
      "pdf-lib": "^1.17.1",
      "pdf-parse": "^1.1.1",
      "pdfjs-dist": "^4.0.370",
      "archiver": "^6.0.1",
      "mammoth": "^1.6.0",
      "docx": "^8.2.4",
      "exceljs": "^4.4.0",
      "pptxgenjs": "^3.12.0",
      "marked": "^11.1.1",
      "turndown": "^7.1.2",
      "papaparse": "^5.4.1",
      "sharp": "^0.33.2",
      "jszip": "^3.10.1"
    }
  },
  'qofeno-image': {
    "name": "qofeno-image",
    "version": "1.0.0",
    "type": "module",
    "dependencies": {
      "node-appwrite": "^26.2.0",
      "sharp": "^0.33.2",
      "@imgly/background-removal-node": "^1.4.5",
      "heic-convert": "^2.1.0",
      "jimp": "^0.22.10",
      "pdf-lib": "^1.17.1",
      "qrcode": "^1.5.3",
      "canvas": "^2.11.2",
      "chroma-js": "^2.4.2",
      "color-thief-node": "^1.0.4",
      "image-hash": "^4.0.1",
      "svgo": "^3.2.0",
      "to-ico": "^1.1.5",
      "gif-encoder-2": "^1.0.5",
      "archiver": "^6.0.1"
    }
  },
  'qofeno-video': {
    "name": "qofeno-video",
    "version": "1.0.0",
    "type": "module",
    "dependencies": {
      "node-appwrite": "^26.2.0",
      "fluent-ffmpeg": "^2.1.2",
      "ffprobe-static": "^3.1.0",
      "archiver": "^6.0.1",
      "sharp": "^0.33.2"
    }
  },
  'qofeno-audio': {
    "name": "qofeno-audio",
    "version": "1.0.0",
    "type": "module",
    "dependencies": {
      "node-appwrite": "^26.2.0",
      "fluent-ffmpeg": "^2.1.2",
      "ffprobe-static": "^3.1.0",
      "node-id3": "^0.2.6",
      "music-tempo": "^1.0.2",
      "archiver": "^6.0.1"
    }
  },
  'qofeno-text': {
    "name": "qofeno-text",
    "version": "1.0.0",
    "type": "module",
    "dependencies": {
      "node-appwrite": "^26.2.0",
      "natural": "^6.12.0",
      "franc": "^6.2.0",
      "syllable": "^5.0.0",
      "marked": "^11.1.1",
      "turndown": "^7.1.2",
      "html-to-text": "^9.0.5",
      "diff": "^5.2.0",
      "he": "^1.2.0",
      "pdf-lib": "^1.17.1",
      "docx": "^8.2.4"
    }
  },
  'qofeno-developer': {
    "name": "qofeno-developer",
    "version": "1.0.0",
    "type": "module",
    "dependencies": {
      "node-appwrite": "^26.2.0",
      "js-yaml": "^4.1.0",
      "xml-formatter": "^3.6.2",
      "sql-formatter": "^15.1.2",
      "prettier": "^3.2.5",
      "terser": "^5.29.1",
      "clean-css": "^5.3.3",
      "html-minifier-terser": "^7.2.0",
      "uuid": "^9.0.1",
      "cron-parser": "^4.9.0",
      "ua-parser-js": "^1.0.37",
      "zxcvbn": "^4.4.2",
      "diff": "^5.2.0",
      "he": "^1.2.0"
    }
  },
  'qofeno-data': {
    "name": "qofeno-data",
    "version": "1.0.0",
    "type": "module",
    "dependencies": {
      "node-appwrite": "^26.2.0",
      "papaparse": "^5.4.1",
      "xlsx": "^0.18.5",
      "exceljs": "^4.4.0",
      "archiver": "^6.0.1"
    }
  },
  'qofeno-security': {
    "name": "qofeno-security",
    "version": "1.0.0",
    "type": "module",
    "dependencies": {
      "node-appwrite": "^26.2.0",
      "qrcode": "^1.5.3",
      "jsbarcode": "^3.11.6",
      "jsqr": "^1.4.0",
      "bcryptjs": "^2.4.3",
      "node-forge": "^1.3.1",
      "zxcvbn": "^4.4.2",
      "canvas": "^2.11.2",
      "sharp": "^0.33.2",
      "convert-units": "^2.3.4",
      "chroma-js": "^2.4.2"
    }
  }
};

const DOCKERFILES = {
  'qofeno-pdf': `FROM node:18-alpine

RUN apk add --no-cache \\
    ghostscript \\
    poppler-utils \\
    libreoffice \\
    libreoffice-writer \\
    libreoffice-calc \\
    libreoffice-impress \\
    font-noto \\
    font-noto-cjk \\
    font-noto-emoji \\
    tesseract-ocr \\
    tesseract-ocr-data-eng \\
    tesseract-ocr-data-ara \\
    tesseract-ocr-data-hin \\
    tesseract-ocr-data-fra \\
    tesseract-ocr-data-deu \\
    tesseract-ocr-data-spa \\
    python3 \\
    py3-pip \\
    inkscape \\
    pandoc \\
    && rm -rf /var/cache/apk/*

WORKDIR /usr/local/code
COPY package.json ./
RUN npm install --production
COPY src/ ./src/
CMD ["node", "src/main.js"]
`,
  'qofeno-image': `FROM node:18-alpine

RUN apk add --no-cache \\
    imagemagick \\
    imagemagick-libs \\
    imagemagick-dev \\
    vips \\
    vips-dev \\
    gifsicle \\
    potrace \\
    dcraw \\
    libheif \\
    libheif-tools \\
    && rm -rf /var/cache/apk/*

WORKDIR /usr/local/code
COPY package.json ./
RUN npm install --production
COPY src/ ./src/
CMD ["node", "src/main.js"]
`,
  'qofeno-video': `FROM node:18-alpine

RUN apk add --no-cache \\
    ffmpeg \\
    ffmpeg-libs \\
    && rm -rf /var/cache/apk/*

WORKDIR /usr/local/code
COPY package.json ./
RUN npm install --production
COPY src/ ./src/
CMD ["node", "src/main.js"]
`,
  'qofeno-audio': `FROM node:18-alpine

RUN apk add --no-cache \\
    ffmpeg \\
    ffmpeg-libs \\
    && rm -rf /var/cache/apk/*

WORKDIR /usr/local/code
COPY package.json ./
RUN npm install --production
COPY src/ ./src/
CMD ["node", "src/main.js"]
`
};

const UTILS = {
  'appwrite.js': `import { Client, Storage, Databases, ID, Permission, Role } from "node-appwrite"

export function createClient() {
  return new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)
}

export function getStorage(client) { return new Storage(client) }
export function getDatabases(client) { return new Databases(client) }
export { ID, Permission, Role }
`,
  'validate.js': `import { existsSync, statSync, readFileSync } from "fs"

export function validateOutput(outputPath, mimeType) {
  if (!existsSync(outputPath)) throw new Error("Output file was not created")
  const stat = statSync(outputPath)
  if (stat.size === 0) throw new Error("Output file is empty")
  const buf = readFileSync(outputPath)

  const signatures = {
    "application/pdf":        b => b.slice(0,4).toString("ascii") === "%PDF",
    "image/jpeg":             b => b[0] === 0xFF && b[1] === 0xD8,
    "image/png":              b => b[0] === 0x89 && b[1] === 0x50,
    "image/webp":             b => b.slice(8,12).toString("ascii") === "WEBP",
    "image/gif":              b => b.slice(0,3).toString("ascii") === "GIF",
    "image/tiff":             b => (b[0] === 0x49 && b[1] === 0x49) || (b[0] === 0x4D && b[1] === 0x4D),
    "video/mp4":              b => b.slice(4,8).toString("ascii") === "ftyp",
    "audio/mpeg":             b => b[0] === 0xFF && (b[1] & 0xE0) === 0xE0,
    "audio/wav":              b => b.slice(0,4).toString("ascii") === "RIFF",
    "audio/flac":             b => b.slice(0,4).toString("ascii") === "fLaC",
    "audio/ogg":              b => b.slice(0,4).toString("ascii") === "OggS",
    "application/zip":        b => b[0] === 0x50 && b[1] === 0x4B,
  }

  const effectiveMime = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/epub+zip",
    "application/vnd.oasis.opendocument.text"
  ].includes(mimeType) ? "application/zip" : mimeType

  const check = signatures[effectiveMime]
  if (check && !check(buf)) {
    throw new Error(\`Output file is not a valid \${mimeType}\`)
  }

  return stat.size
}
`,
  'cleanup.js': `import { existsSync, unlinkSync } from "fs"

export async function cleanup(storage, bucketId, fileIds = [], tmpPaths = []) {
  for (const fileId of fileIds.filter(Boolean)) {
    try { await storage.deleteFile(bucketId, fileId) } catch {}
  }
  for (const p of tmpPaths.filter(Boolean)) {
    try { if (existsSync(p)) unlinkSync(p) } catch {}
  }
}
`,
  'response.js': `export function success(res, data) {
  return res.json({ success: true, ...data })
}

export function error(res, message, code = "PROCESSING_FAILED", status = 500) {
  return res.json({ success: false, error: message, code }, status)
}

export function unauthorized(res, message = "Pro plan required") {
  return res.json({ success: false, error: message, code: "AUTH_REQUIRED" }, 401)
}

export function forbidden(res, message = "Upgrade your plan to use this tool") {
  return res.json({ success: false, error: message, code: "PLAN_REQUIRED" }, 403)
}

export function tooLarge(res, maxBytes) {
  return res.json({
    success: false,
    error: \`File too large. Max size: \${formatBytes(maxBytes)}\`,
    code: "FILE_TOO_LARGE"
  }, 413)
}

function formatBytes(b) {
  if (b >= 1073741824) return \`\${(b/1073741824).toFixed(1)}GB\`
  if (b >= 1048576) return \`\${(b/1048576).toFixed(0)}MB\`
  return \`\${(b/1024).toFixed(0)}KB\`
}
`,
  'auth.js': `import { Query } from "node-appwrite"

export async function verifyPlan(db, userId, requiredPlan) {
  if (!userId) return false

  const meta = await db.listDocuments(process.env.DATABASE_ID, "users_meta", [
    Query.equal("user_id", userId),
    Query.limit(1)
  ])

  const plan = meta.documents[0]?.plan ?? "free"

  if (requiredPlan === "teams") return plan === "teams"
  if (requiredPlan === "pro")   return ["pro", "teams"].includes(plan)
  return true
}
`,
  'rate-limit.js': `import { ID, Query } from "node-appwrite"

export async function checkRateLimit(db, identifier, plan) {
  const limits = { free: 20, pro: 200, teams: 1000 }
  const limit = limits[plan] || limits.free
  const windowStart = new Date(Math.floor(Date.now() / 3600000) * 3600000).toISOString()
  const key = \`\${identifier}_\${windowStart}\`

  const existing = await db.listDocuments(process.env.DATABASE_ID, "rate_limits", [
    Query.equal("key", key), Query.limit(1)
  ])

  if (existing.total > 0) {
    if (existing.documents[0].count >= limit) {
      throw new Error(\`Rate limit exceeded. \${limit} requests/hour on \${plan} plan.\`)
    }
    await db.updateDocument(
      process.env.DATABASE_ID, "rate_limits",
      existing.documents[0].$id,
      { count: existing.documents[0].count + 1 }
    )
  } else {
    await db.createDocument(
      process.env.DATABASE_ID, "rate_limits", ID.unique(),
      { key, count: 1, window_start: windowStart }
    )
  }
}
`,
  'upload.js': `import { Permission, Role, ID } from "node-appwrite"
import { readFileSync } from "fs"

export async function uploadOutput(storage, filePath, mimeType, filename) {
  const buf = readFileSync(filePath)
  const file = await storage.createFile(
    process.env.BUCKET_OUTPUTS,
    ID.unique(),
    new Blob([buf], { type: mimeType }),
    [Permission.read(Role.any()), Permission.delete(Role.any())]
  )

  const downloadUrl = \`\${process.env.APPWRITE_ENDPOINT}/storage/buckets/\${process.env.BUCKET_OUTPUTS}/files/\${file.$id}/download?project=\${process.env.APPWRITE_PROJECT_ID}\`

  return { file, downloadUrl, filename, size: buf.length }
}
`
};

function main() {
  console.log('Generating grouped function folders under', FUNCTIONS_ROOT);

  for (const cat of CATEGORIES) {
    const catDir = path.join(FUNCTIONS_ROOT, cat);
    const srcDir = path.join(catDir, 'src');
    const handlersDir = path.join(srcDir, 'handlers');
    const utilsDir = path.join(srcDir, 'utils');

    // Create directories
    fs.mkdirSync(catDir, { recursive: true });
    fs.mkdirSync(srcDir, { recursive: true });
    fs.mkdirSync(handlersDir, { recursive: true });
    fs.mkdirSync(utilsDir, { recursive: true });

    // Write package.json
    fs.writeFileSync(
      path.join(catDir, 'package.json'),
      JSON.stringify(PACKAGES[cat], null, 2)
    );

    // Write Dockerfile if needed
    if (DOCKERFILES[cat]) {
      fs.writeFileSync(path.join(catDir, 'Dockerfile'), DOCKERFILES[cat]);
    }

    // Write utilities
    for (const [name, content] of Object.entries(UTILS)) {
      fs.writeFileSync(path.join(utilsDir, name), content);
    }

    console.log(`✓ Configured: ${cat}`);
  }

  console.log('Grouped directories creation complete!');
}

main();
