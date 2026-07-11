/**
 * weekly-blog-summary.js — Aggregates whats_new updates published in the last 7 days,
 * groups them by category (New Tools, Improvements, Fixes), and creates a unified weekly blog post.
 */
import { Client, Databases, Query, ID } from 'node-appwrite';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env files safely
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function run() {
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

  console.log('Fetching whats_new updates from the last 7 days...');
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    const response = await db.listDocuments(databaseId, 'whats_new', [
      Query.equal('published', true),
      Query.greaterThan('created_at', sevenDaysAgo.toISOString()),
      Query.orderDesc('created_at')
    ]);

    const updates = response.documents || [];
    if (updates.length === 0) {
      console.log('✓ No updates found in the last 7 days. Skipping weekly blog summary.');
      return;
    }

    console.log(`Found ${updates.length} updates. Grouping...`);

    const newTools = [];
    const improvements = [];
    const fixes = [];

    for (const update of updates) {
      const type = String(update.type || '').toLowerCase();
      if (type === 'new_tool' || type === 'tool') {
        newTools.push(update);
      } else if (type === 'fix' || type === 'bug') {
        fixes.push(update);
      } else {
        improvements.push(update);
      }
    }

    // Format Markdown content
    const dateToday = new Date();
    const datePrev = new Date();
    datePrev.setDate(datePrev.getDate() - 7);

    const dateOptions = { month: 'short', day: 'numeric' };
    const dateRangeStr = `${datePrev.toLocaleDateString('en-US', dateOptions)} - ${dateToday.toLocaleDateString('en-US', dateOptions)}`;
    const title = `Weekly Update: ${dateRangeStr}`;
    const slug = `weekly-update-${datePrev.toISOString().split('T')[0]}-${dateToday.toISOString().split('T')[0]}`;

    let mdContent = `Welcome to your weekly Qofeno digest! Here is everything we shipped and improved between **${dateRangeStr}**.\n\n`;

    if (newTools.length > 0) {
      mdContent += `### 🚀 New Tools\n`;
      newTools.forEach(item => {
        mdContent += `- **${item.title}**: ${item.body || item.content || ''}\n`;
      });
      mdContent += `\n`;
    }

    if (improvements.length > 0) {
      mdContent += `### ✨ Improvements\n`;
      improvements.forEach(item => {
        mdContent += `- **${item.title}**: ${item.body || item.content || ''}\n`;
      });
      mdContent += `\n`;
    }

    if (fixes.length > 0) {
      mdContent += `### 🐛 Fixes & Polishing\n`;
      fixes.forEach(item => {
        mdContent += `- **${item.title}**: ${item.body || item.content || ''}\n`;
      });
      mdContent += `\n`;
    }

    mdContent += `\n*Have any tool ideas or feedback? Send us a message on our contact page!*`;

    const excerpt = `Discover all new tools, enhancements, and fixes deployed on Qofeno during the week of ${dateRangeStr}.`;

    // Create the blog post
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

    console.log(`✓ Weekly blog summary created successfully! ID: ${newDoc.$id}`);

  } catch (err) {
    console.error('❌ Failed to run weekly blog summary:', err.message);
    process.exit(1);
  }
}

run();
