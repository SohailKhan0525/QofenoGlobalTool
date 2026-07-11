import { Client, Databases, ID, Query } from "node-appwrite"
import { readdirSync, existsSync } from "fs"
import { join } from "path"
import dotenv from "dotenv"

// Load .env
dotenv.config()

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)

const db = new Databases(client)
const databaseId = process.env.DATABASE_ID || "qofeno_db"

async function run() {
  console.log("Checking roadmap collection schema...");

  // 1. Ensure collection attributes exist
  let colInfo = await db.getCollection(databaseId, "roadmap");
  let existingKeys = colInfo.attributes.map(a => a.key);

  const attributesToEnsure = [
    { key: 'category', type: 'string', size: 128, required: false },
    { key: 'tool_slug', type: 'string', size: 128, required: false },
    { key: 'shipped_at', type: 'string', size: 64, required: false },
    { key: 'created_at', type: 'string', size: 64, required: false },
    { key: 'updated_at', type: 'string', size: 64, required: false }
  ];

  let addedAny = false;
  for (const attr of attributesToEnsure) {
    if (!existingKeys.includes(attr.key)) {
      console.log(`Creating missing attribute: ${attr.key}...`);
      await db.createStringAttribute(databaseId, "roadmap", attr.key, attr.size, attr.required);
      addedAny = true;
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  if (addedAny) {
    console.log("Waiting for new roadmap attributes to settle...");
    while (true) {
      const updatedCol = await db.getCollection(databaseId, "roadmap");
      const pending = updatedCol.attributes.filter(a => a.status !== 'available');
      if (pending.length === 0) {
        console.log("All roadmap attributes are available.");
        break;
      }
      console.log(`Waiting on ${pending.length} attributes to settle...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Get all tool slugs from filesystem (appwrite-functions/tools/)
  const toolsDir = join(process.cwd(), "appwrite-functions/tools")
  
  const filesystemSlugs = []
  if (existsSync(toolsDir)) {
    const dirs = readdirSync(toolsDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('_'))
      .map(d => d.name)
    filesystemSlugs.push(...dirs)
  }

  // Get active tools from Appwrite collection
  const activeToolsRes = await db.listDocuments(databaseId, "tools", [
    Query.limit(100)
  ])
  const activeToolSlugs = activeToolsRes.documents.map(t => t.slug)

  // 2. Process active/shipped tools
  for (const slug of activeToolSlugs) {
    const tool = activeToolsRes.documents.find(t => t.slug === slug)
    const existing = await db.listDocuments(databaseId, "roadmap", [
      Query.equal("tool_slug", slug),
      Query.limit(1)
    ])

    if (existing.total > 0) {
      await db.updateDocument(databaseId, "roadmap", existing.documents[0].$id, {
        status: "shipped",
        shipped_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    } else {
      await db.createDocument(databaseId, "roadmap", ID.unique(), {
        title: tool?.name || slug,
        description: tool?.description || `High-quality ${slug} tool running securely on Qofeno.`,
        status: "shipped",
        tool_slug: slug,
        category: tool?.category || "platform",
        shipped_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        order: 0
      })
    }
  }

  // 3. Process filesystem tools that are not yet active/shipped as in_progress or planned
  for (const slug of filesystemSlugs) {
    if (activeToolSlugs.includes(slug)) continue

    const existing = await db.listDocuments(databaseId, "roadmap", [
      Query.equal("tool_slug", slug),
      Query.limit(1)
    ])

    if (existing.total === 0) {
      await db.createDocument(databaseId, "roadmap", ID.unique(), {
        title: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        description: `Integrating browser-based ${slug} tool.`,
        status: "in_progress",
        tool_slug: slug,
        category: "tools",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        order: 5
      })
    }
  }

  console.log("✓ Roadmap synced successfully")
}

run().catch(console.error)
