import { Client, Databases, ID, Query } from "node-appwrite"

import fs from "fs"

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)

const db = new Databases(client)
const databaseId = process.env.DATABASE_ID || 'qofeno_db';

async function run() {
  let eventData = {}
  if (process.env.GITHUB_EVENT_PATH && fs.existsSync(process.env.GITHUB_EVENT_PATH)) {
    try {
      eventData = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"))
    } catch (err) {
      console.error("Failed to parse event payload:", err.message)
    }
  }

  const commitMsg = eventData.head_commit?.message || process.env.COMMIT_MSG || ""
  const releaseName = eventData.release?.name || process.env.RELEASE_NAME || ""
  const releaseBody = eventData.release?.body || process.env.RELEASE_BODY || ""
  const postType = eventData.inputs?.post_type || process.env.POST_TYPE || "improvement"
  const manualTitle = eventData.inputs?.title || process.env.POST_TITLE || ""
  const manualBody = eventData.inputs?.body || process.env.POST_BODY || ""

  let title, body, type

  // Manual dispatch takes priority
  if (manualTitle && manualBody) {
    title = manualTitle
    body = manualBody
    type = postType
  }
  // GitHub release
  else if (releaseName) {
    title = releaseName
    body = releaseBody || `Released: ${releaseName}`
    type = "announcement"
  }
  // Detect from commit message keywords
  else {
    const msg = commitMsg.toLowerCase()
    if (msg.includes("feat:") || msg.includes("add:") || msg.includes("new tool")) {
      type = "new_tool"
      title = `New: ${commitMsg.replace(/^feat:|^add:/i, "").trim()}`
      body = commitMsg
    } else if (msg.includes("fix:") || msg.includes("bug:")) {
      type = "fix"
      title = `Fixed: ${commitMsg.replace(/^fix:|^bug:/i, "").trim()}`
      body = commitMsg
    } else if (msg.includes("improve:") || msg.includes("update:") || msg.includes("refactor:")) {
      type = "improvement"
      title = `Improved: ${commitMsg.replace(/^improve:|^update:|^refactor:/i, "").trim()}`
      body = commitMsg
    } else {
      console.log("No relevant commit keywords found. Skipping blog post.")
      return
    }
  }

  // Check for duplicate (same title in last 24h)
  const yesterday = new Date(Date.now() - 86400000).toISOString()
  const existing = await db.listDocuments(databaseId, "whats_new", [
    Query.equal("title", title),
    Query.greaterThan("created_at", yesterday)
  ])
  if (existing.total > 0) {
    console.log("Duplicate post detected. Skipping.")
    return
  }

  // Create in whats_new
  const entry = await db.createDocument(databaseId, "whats_new", ID.unique(), {
    title, body, type,
    author: "Mohd Zaheer Uddin",
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

  // Also create in blog_posts
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80)
  await db.createDocument(databaseId, "blog_posts", ID.unique(), {
    title,
    slug: `${slug}-${Date.now()}`,
    content: body,
    excerpt: body.substring(0, 200),
    type,
    author: "Mohd Zaheer Uddin",
    published: true,
    published_at: new Date().toISOString(),
    source_id: entry.$id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

  console.log(`✓ Blog post published: "${title}" (${type})`)
}

run().catch(console.error)
