/**
 * fix_tools_collection.cjs
 * Fixes tool categories in the Appwrite tools collection and adds missing tools.
 */
const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);
const DB_ID = 'qofeno_db';
const COLLECTION_ID = 'tools';

// Correct categories for tools that are miscategorized
const CATEGORY_FIXES = {
  // These are in "Video Tools" but should be "Audio Tools"
  'background-noise-remover': 'Audio Tools',
  'silence-remover': 'Audio Tools',
  'change-speed': 'Audio Tools',
  'change-pitch': 'Audio Tools',
  
  // These are in wrong categories
  'image-bg-remover': 'Image Tools',
};

// Missing tools to add
const MISSING_TOOLS = [
  {
    slug: 'jpg-to-png',
    name: 'JPG to PNG',
    description: 'Convert JPG/JPEG images to PNG format.',
    category: 'Image Tools',
    is_free: true,
    is_new: false,
    function_id: 'image-converter',
    accepted_types: ['image/jpeg', 'image/jpg'],
    output_type: 'image/png',
    max_file_size_free: 52428800,
    max_file_size_pro: 524288000,
    is_active: true,
  },
  {
    slug: 'png-to-webp',
    name: 'PNG to WebP',
    description: 'Convert PNG images to WebP format for smaller file sizes.',
    category: 'Image Tools',
    is_free: true,
    is_new: false,
    function_id: 'image-converter',
    accepted_types: ['image/png'],
    output_type: 'image/webp',
    max_file_size_free: 52428800,
    max_file_size_pro: 524288000,
    is_active: true,
  },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  // Get all tools
  const result = await db.listDocuments(DB_ID, COLLECTION_ID, [Query.limit(200)]);
  const tools = result.documents;
  console.log(`Found ${tools.length} tools`);
  
  // Fix categories
  for (const tool of tools) {
    if (CATEGORY_FIXES[tool.slug]) {
      const newCat = CATEGORY_FIXES[tool.slug];
      if (tool.category !== newCat) {
        try {
          await db.updateDocument(DB_ID, COLLECTION_ID, tool['$id'], { category: newCat });
          console.log(`FIXED: ${tool.slug} | ${tool.category} → ${newCat}`);
        } catch (e) {
          console.log(`FAIL fix ${tool.slug}: ${e.message}`);
        }
        await sleep(200);
      }
    }
  }
  
  // Add missing tools
  const existingSlugs = new Set(tools.map(t => t.slug));
  
  for (const toolData of MISSING_TOOLS) {
    if (existingSlugs.has(toolData.slug)) {
      console.log(`EXISTS: ${toolData.slug}`);
      continue;
    }
    
    try {
      const now = new Date().toISOString();
      await db.createDocument(DB_ID, COLLECTION_ID, 'unique()', {
        ...toolData,
        is_new_until: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        created_at: now,
        updated_at: now,
      });
      console.log(`ADDED: ${toolData.slug}`);
    } catch (e) {
      console.log(`FAIL add ${toolData.slug}: ${e.message}`);
    }
    await sleep(200);
  }
  
  console.log('\nDone!');
}

main().catch(e => { console.error(e.message); process.exit(1); });
