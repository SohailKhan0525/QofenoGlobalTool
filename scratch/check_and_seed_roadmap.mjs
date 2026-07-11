import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(\w+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  }
}

loadEnv();

const ENDPOINT = process.env.APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.DATABASE_ID || 'qofeno_db';
const COLLECTION_ID = 'roadmap';

async function request(method, urlPath, body = null) {
  const url = `${ENDPOINT.replace(/\/$/, '')}${urlPath}`;
  const headers = {
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': API_KEY,
    'Content-Type': 'application/json',
  };
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Appwrite request failed: ${res.status} ${text}`);
  }
  return res.status === 204 ? null : res.json();
}

async function main() {
  console.log("Checking database...");
  
  // 1. Create or verify collection
  let collectionExists = false;
  try {
    await request('GET', `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}`);
    collectionExists = true;
    console.log("Roadmap collection already exists.");
  } catch (err) {
    console.log("Creating roadmap collection...");
    await request('POST', `/databases/${DATABASE_ID}/collections`, {
      collectionId: COLLECTION_ID,
      name: COLLECTION_ID,
      permissions: ['read("any")'],
      documentSecurity: true,
      enabled: true,
    });
    console.log("Created roadmap collection.");
  }

  // 2. Create attributes if needed
  const attributes = [
    { key: 'title', type: 'string', size: 256, required: true },
    { key: 'description', type: 'string', size: 1024, required: true },
    { key: 'status', type: 'string', size: 64, required: true },
    { key: 'order', type: 'integer', required: false, default: 0 }
  ];

  for (const attr of attributes) {
    try {
      await request('POST', `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/attributes/${attr.type}`, {
        key: attr.key,
        required: attr.required,
        size: attr.size,
        default: attr.default,
      });
      console.log(`Created attribute: ${attr.key}`);
      // Wait for attribute creation to settle
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.log(`Attribute ${attr.key} check: already exists or pending.`);
    }
  }

  // 3. Create index
  try {
    await request('POST', `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/indexes`, {
      key: 'order_idx',
      type: 'key',
      attributes: ['order'],
    });
    console.log("Created index on order.");
  } catch (err) {
    console.log("Index order_idx already exists.");
  }

  // 4. Seed initial documents if empty
  const docList = await request('GET', `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`);
  if (docList.total === 0) {
    console.log("Seeding default roadmap items...");
    const initialItems = [
      { title: "PDF Utilities", description: "PDF compression, page rotation, formats convert.", status: "shipped", order: 1 },
      { title: "Developer Utilities", description: "JSON formatting, Base64 encoding, text converters.", status: "shipped", order: 2 },
      { title: "Video Tool Integrations", description: "Adding browser-based video compression and trimming tools.", status: "in_progress", order: 3 },
      { title: "AI Writing Tools", description: "Advanced AI assistance for paraphrasing, grammar, and outlines.", status: "planned", order: 4 }
    ];
    for (const item of initialItems) {
      await request('POST', `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`, {
        documentId: 'unique()',
        data: item,
        permissions: ['read("any")']
      });
      console.log(`Seeded item: ${item.title}`);
    }
  } else {
    console.log(`Roadmap already contains ${docList.total} documents.`);
  }

  console.log("Roadmap provisioning and seeding completed!");
}

main().catch(console.error);
