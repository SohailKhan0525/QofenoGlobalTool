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

const MAIN_CONTENT = `import { createClient, getStorage, getDatabases } from "./utils/appwrite.js";
import { success, error, unauthorized, forbidden } from "./utils/response.js";
import { verifyPlan } from "./utils/auth.js";
import { checkRateLimit } from "./utils/rate-limit.js";

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

  // Auth check for pro/teams tools
  if (requiredPlan !== "free" && !user_id) {
    return unauthorized(res, \`Authentication required for \${tool} (Premium Tool)\`);
  }

  // Plan validation
  if (requiredPlan !== "free") {
    const hasAccess = await verifyPlan(db, user_id, requiredPlan);
    if (!hasAccess) {
      return forbidden(res, \`Active \${requiredPlan} subscription required\`);
    }
  }

  // Rate limiting (IP fallback for anonymous users)
  const identifier = user_id || req.headers['x-real-ip'] || req.headers['client-ip'] || 'anonymous';
  const plan = user_id ? (requiredPlan !== "free" ? requiredPlan : "free") : "free";
  try {
    await checkRateLimit(db, identifier, plan);
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
    const result = await handler({ body, storage, db, client, context });
    return success(res, result);
  } catch (err) {
    logError(\`Execution error in \${tool}: \${err.stack || err.message}\`);
    return error(res, err.message, "PROCESSING_ERROR", 500);
  }
};
`;

function main() {
  for (const cat of CATEGORIES) {
    const mainFile = path.join(FUNCTIONS_ROOT, cat, 'src', 'main.js');
    fs.writeFileSync(mainFile, MAIN_CONTENT);
    console.log(`✓ Wrote main.js for ${cat}`);
  }
  console.log('Finished writing category router files!');
}

main();
