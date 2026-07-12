/**
 * weekly-blog-summary.js
 * Aggregates whats_new updates from the last 7 days and creates a unified
 * weekly digest blog post. Skips if no updates found or already posted.
 *
 * Called by: .github/workflows/weekly-blog-summary.yml (every Monday 9am UTC)
 * Also works locally: node scripts/weekly-blog-summary.js (reads .env)
 */
import { Client, Databases, Query, ID } from 'node-appwrite';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Load .env only when running locally (not in CI where secrets are injected)
if (!process.env.APPWRITE_API_KEY) {
  try {
    const { default: dotenv } = await import('dotenv');
    const envPath = resolve(process.cwd(), '.env');
    if (existsSync(envPath)) {
      dotenv.config({ path: envPath });
      console.log('Loaded .env file.');
    }
  } catch {
    // dotenv might not be installed; not critical in CI
  }
}

const endpoint = process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.DATABASE_ID || 'qofeno_db';

if (!projectId || !apiKey) {
  console.error('❌ APPWRITE_PROJECT_ID and APPWRITE_API_KEY must be set.');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const db = new Databases(client);

async function run() {
  console.log('Fetching whats_new updates from the last 7 days...');
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get all updates in last 7 days
  const response = await db.listDocuments(databaseId, 'whats_new', [
    Query.equal('published', true),
    Query.greaterThan('created_at', sevenDaysAgo.toISOString()),
    Query.orderDesc('created_at'),
    Query.limit(100)
  ]);

  const updates = response.documents || [];
  if (updates.length === 0) {
    console.log('✓ No updates found in the last 7 days. Skipping weekly blog summary.');
    return;
  }

  console.log(`Found ${updates.length} updates. Building summary...`);

  // Check duplicate: already posted this week?
  const existing = await db.listDocuments(databaseId, 'blog_posts', [
    Query.equal('type', 'product_update'),
    Query.greaterThan('created_at', sevenDaysAgo.toISOString()),
    Query.limit(10)
  ]);
  const alreadyPosted = (existing.documents || []).some(p =>
    String(p.title || '').startsWith('Weekly Update')
  );
  if (alreadyPosted) {
    console.log('✓ Weekly summary already posted this week. Skipping.');
    return;
  }

  // Group by type
  const newTools = updates.filter(u => ['new_tool', 'tool'].includes(String(u.type).toLowerCase()));
  const improvements = updates.filter(u => ['improvement', 'update', 'announcement', 'product_update'].includes(String(u.type).toLowerCase()));
  const fixes = updates.filter(u => ['fix', 'bug'].includes(String(u.type).toLowerCase()));

  // Build date range labels
  const dateToday = new Date();
  const datePrev = new Date();
  datePrev.setDate(datePrev.getDate() - 7);
  const dateOptions = { month: 'short', day: 'numeric' };
  const dateRangeStr = `${datePrev.toLocaleDateString('en-US', dateOptions)} – ${dateToday.toLocaleDateString('en-US', dateOptions)}`;
  const title = `Weekly Update: ${dateRangeStr}`;
  const slug = `weekly-update-${datePrev.toISOString().split('T')[0]}-to-${dateToday.toISOString().split('T')[0]}`;

  // Build markdown content
  let mdContent = `Welcome to your weekly Qofeno digest! Here's everything we shipped and improved between **${dateRangeStr}**.\n\n`;

  if (newTools.length > 0) {
    mdContent += `### 🚀 New Tools (${newTools.length})\n`;
    newTools.forEach(item => {
      mdContent += `- **${item.title}**: ${(item.body || item.content || '').substring(0, 120)}\n`;
    });
    mdContent += '\n';
  }

  if (improvements.length > 0) {
    mdContent += `### ✨ Improvements (${improvements.length})\n`;
    improvements.forEach(item => {
      mdContent += `- **${item.title}**: ${(item.body || item.content || '').substring(0, 120)}\n`;
    });
    mdContent += '\n';
  }

  if (fixes.length > 0) {
    mdContent += `### 🐛 Fixes & Polishing (${fixes.length})\n`;
    fixes.forEach(item => {
      mdContent += `- **${item.title}**: ${(item.body || item.content || '').substring(0, 120)}\n`;
    });
    mdContent += '\n';
  }

  mdContent += `\n*Have tool ideas or feedback? Drop us a message on the [contact page](https://qofeno.com/contact)!*\n\n— Mohd Zaheer Uddin`;

  const excerpt = `Discover all new tools, enhancements, and fixes deployed on Qofeno during the week of ${dateRangeStr}.`;

  // Create blog post
  console.log(`Creating blog post: "${title}"...`);
  const newDoc = await db.createDocument(databaseId, 'blog_posts', ID.unique(), {
    title,
    slug,
    content: mdContent,
    excerpt,
    type: 'product_update',
    author: 'Mohd Zaheer Uddin',
    published: true,
    published_at: dateToday.toISOString(),
    created_at: dateToday.toISOString(),
    updated_at: dateToday.toISOString()
  });

  console.log(`✓ Weekly blog summary created! ID: ${newDoc.$id}, title: "${title}"`);
}

run().catch(err => {
  console.error('❌ Failed to run weekly blog summary:', err.message);
  process.exit(1);
});
