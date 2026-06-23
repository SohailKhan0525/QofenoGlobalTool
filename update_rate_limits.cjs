const fs = require('fs');
const path = require('path');

const toolsDir = 'c:/Qofeno/QofenoGlobalTool/appwrite-functions/tools';

const rateLimitCode = `
    // RATE LIMITING
    const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown_ip';
    const hourKey = \`\${clientIp}_\${Math.floor(Date.now() / 3600000)}\`;
    
    let isProUser = false;
    if (body.user_id) {
      try {
        const userMeta = await db.getDocument(process.env.DATABASE_ID, 'users_meta', body.user_id);
        if (userMeta && (userMeta.plan === 'pro' || userMeta.plan === 'enterprise')) {
          isProUser = true;
        }
      } catch (err) { /* ignore */ }
    }
    
    const limit = isProUser ? 100 : 20;
    
    try {
      const existing = await db.listDocuments(process.env.DATABASE_ID, 'rate_limits', [
        Query.equal('key', hourKey)
      ]);
      
      if (existing.total > 0) {
        if (existing.documents[0].count >= limit) {
          return res.json({
            success: false,
            error: "Rate limit exceeded. Please wait or upgrade to PRO."
          }, 429);
        } else {
          await db.updateDocument(process.env.DATABASE_ID, 'rate_limits', existing.documents[0].$id, {
            count: existing.documents[0].count + 1,
            updated_at: new Date().toISOString()
          });
        }
      } else {
        await db.createDocument(process.env.DATABASE_ID, 'rate_limits', ID.unique(), {
          key: hourKey,
          ip: clientIp,
          count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      log('Rate limit check failed, skipping: ' + err.message);
    }
    // END RATE LIMITING
`;

function injectRateLimiting(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      const mainJs = path.join(fullPath, 'src', 'main.js');
      if (fs.existsSync(mainJs)) {
        let content = fs.readFileSync(mainJs, 'utf8');
        
        // ensure Query is imported
        if (!content.includes('import { Query }')) {
          content = content.replace("import { Client, Databases", "import { Client, Databases, Query");
          content = content.replace("import { Client, ID, Databases", "import { Client, ID, Databases, Query");
        }
        
        if (!content.includes('RATE LIMITING')) {
          content = content.replace(
            "try {\n", 
            `try {\n${rateLimitCode}\n`
          );
          fs.writeFileSync(mainJs, content, 'utf8');
        }
      }
    }
  }
}

injectRateLimiting(toolsDir);
console.log('Rate limiting injected across all tools');
