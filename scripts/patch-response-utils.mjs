// scripts/patch-response-utils.mjs
import fs from 'fs';
import path from 'path';

const functions = [
  'qofeno-pdf',
  'qofeno-image',
  'qofeno-video',
  'qofeno-audio',
  'qofeno-text',
  'qofeno-developer',
  'qofeno-data',
  'qofeno-security'
];

const responseJsContent = `export function success(res, data) {
  return res.json({ success: true, ...data }, 200)
}

export function error(res, message, code = "PROCESSING_FAILED", status = 200) {
  return res.json({ success: false, error: message, code }, status)
}

export function unauthorized(res, message = "Pro plan required") {
  return res.json({ success: false, error: message, code: "AUTH_REQUIRED" }, 200)
}

export function forbidden(res, message = "Upgrade your plan to use this tool") {
  return res.json({ success: false, error: message, code: "PLAN_REQUIRED" }, 200)
}

export function tooLarge(res, maxBytes) {
  return res.json({
    success: false,
    error: \`File too large. Max size: \${formatBytes(maxBytes)}\`,
    code: "FILE_TOO_LARGE"
  }, 200)
}

function formatBytes(b) {
  if (b >= 1073741824) return \`\${(b/1073741824).toFixed(1)}GB\`
  if (b >= 1048576) return \`\${(b/1048576).toFixed(0)}MB\`
  return \`\${(b/1024).toFixed(0)}KB\`
}
`;

for (const fn of functions) {
  const filePath = path.join(process.cwd(), 'functions', fn, 'src', 'utils', 'response.js');
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(filePath, responseJsContent);
  console.log(`✅ Patched ${fn}/src/utils/response.js`);
}

console.log("All response utils patched successfully!");
