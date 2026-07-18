import fs from 'fs';
import path from 'path';

const categories = [
  'qofeno-pdf',
  'qofeno-image',
  'qofeno-video',
  'qofeno-audio',
  'qofeno-text',
  'qofeno-developer',
  'qofeno-data',
  'qofeno-security'
];

const newMainJsContent = `import { createClient, getStorage, getDatabases } from "./utils/appwrite.js";
import { success, error, unauthorized, forbidden } from "./utils/response.js";
import { verifyPlan } from "./utils/auth.js";
import { checkRateLimit } from "./utils/rate-limit.js";
import { Query } from "node-appwrite";

export default async (context) => {
  const { req, res, error: logError } = context;
  const rawBody = req.body || req.payload || '{}';
  const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
  
  const { tool, user_id, is_pro_tool, is_teams_tool } = body;
  
  if (!tool) {
    return error(res, "Missing 'tool' parameter", "INVALID_REQUEST", 400);
  }

  const client = createClient();
  const db = getDatabases(client);
  const storage = getStorage(client);

  // Determine plan requirements
  let requiredPlan = "free";
  if (is_teams_tool) {
    requiredPlan = "teams";
  } else if (is_pro_tool) {
    requiredPlan = "pro";
  }

  // Fetch actual user plan if user_id is provided
  let userPlan = "free";
  if (user_id) {
    try {
      const meta = await db.listDocuments(process.env.DATABASE_ID || "qofeno_db", "users_meta", [
        Query.equal("user_id", user_id),
        Query.limit(1)
      ]);
      if (meta.documents.length > 0) {
        userPlan = meta.documents[0].plan || "free";
      }
    } catch (err) {
      logError(\`Failed to fetch user plan for \${user_id}: \${err.message}\`);
    }
  }

  // Auth check for pro/teams tools
  if (requiredPlan !== "free" && !user_id) {
    return unauthorized(res, \`Authentication required for \${tool} (Premium Tool)\`);
  }

  // Plan validation
  if (requiredPlan !== "free") {
    const hasAccess = (requiredPlan === "teams") ? (userPlan === "teams") : (["pro", "teams"].includes(userPlan));
    if (!hasAccess) {
      return forbidden(res, \`Active \${requiredPlan} subscription required\`);
    }
  }

  // Rate limiting (IP fallback for anonymous users)
  const identifier = user_id || req.headers['x-real-ip'] || req.headers['client-ip'] || 'anonymous';
  try {
    await checkRateLimit(db, identifier, userPlan);
  } catch (err) {
    return error(res, err.message, "RATE_LIMIT_EXCEEDED", 429);
  }

  // Resolve handler dynamically
  let handler;
  try {
    const handlerModule = await import(\`./handlers/\${tool}.js\`);
    handler = handlerModule.default;
  } catch (err) {
    logError(\`Handler not found for tool \${tool}: \${err.message}\`);
    return error(res, \`Tool '\${tool}' handler not implemented\`, "NOT_IMPLEMENTED", 501);
  }

  // Execute handler
  try {
    const result = await handler(context);
    return result;
  } catch (err) {
    logError(\`Execution error in \${tool}: \${err.stack || err.message}\`);
    return error(res, err.message, "PROCESSING_ERROR", 500);
  }
};
`;

function main() {
  for (const cat of categories) {
    const mainFile = path.resolve('functions', cat, 'src', 'main.js');
    fs.writeFileSync(mainFile, newMainJsContent, 'utf8');
    console.log(`✓ Updated main.js for ${cat} to support actual user plans & context forwarding`);
  }
}

main();
