// scripts/patch-rate-limits-and-mains.mjs
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

const rateLimitJsContent = `import { ID, Query } from "node-appwrite"

export async function checkRateLimit(db, identifier, plan) {
  const limits = { free: 100, pro: 1000, teams: 5000 }
  const limit = limits[plan] || limits.free
  const windowStart = new Date(Math.floor(Date.now() / 3600000) * 3600000).toISOString()
  const key = \`\${identifier}_\${windowStart}\`

  try {
    const existing = await db.listDocuments(process.env.DATABASE_ID || "qofeno_db", "rate_limits", [
      Query.equal("key", key), Query.limit(1)
    ])

    if (existing.total > 0) {
      if (existing.documents[0].count >= limit) {
        throw new Error(\`Rate limit reached (\${limit} requests/hour on \${plan} plan).\`)
      }
      await db.updateDocument(
        process.env.DATABASE_ID || "qofeno_db", "rate_limits",
        existing.documents[0].$id,
        { count: existing.documents[0].count + 1 }
      )
    } else {
      await db.createDocument(
        process.env.DATABASE_ID || "qofeno_db", "rate_limits", ID.unique(),
        { key, count: 1, window_start: windowStart }
      )
    }
  } catch (err) {
    if (err.message.includes("Rate limit reached")) {
      throw err;
    }
    // Don't fail execution if rate_limits collection or DB has temporary issue
    console.log("Rate limit check non-fatal error:", err.message);
  }
}
`;

for (const fn of functions) {
  // Update rate-limit.js
  const rlPath = path.join(process.cwd(), 'functions', fn, 'src', 'utils', 'rate-limit.js');
  const rlDir = path.dirname(rlPath);
  if (!fs.existsSync(rlDir)) {
    fs.mkdirSync(rlDir, { recursive: true });
  }
  fs.writeFileSync(rlPath, rateLimitJsContent);
  console.log(`✅ Patched ${fn}/src/utils/rate-limit.js`);

  // Update main.js to catch rate limit error with 200 HTTP status
  const mainPath = path.join(process.cwd(), 'functions', fn, 'src', 'main.js');
  if (fs.existsSync(mainPath)) {
    let mainCode = fs.readFileSync(mainPath, 'utf8');
    mainCode = mainCode.replace(
      /return error\(res,\s*err\.message,\s*"RATE_LIMIT_EXCEEDED",\s*429\);/g,
      'return error(res, err.message, "RATE_LIMIT_EXCEEDED", 200);'
    );
    mainCode = mainCode.replace(
      /return error\(res,\s*err\.message,\s*"PROCESSING_ERROR",\s*500\);/g,
      'return error(res, err.message, "PROCESSING_ERROR", 200);'
    );
    fs.writeFileSync(mainPath, mainCode);
    console.log(`✅ Patched ${fn}/src/main.js`);
  }
}

console.log("All rate limiters and main handlers patched successfully!");
