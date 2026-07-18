// Updates all tools in Appwrite collection to use grouped function IDs
import { Client, Databases, Query } from "node-appwrite"
import dotenv from "dotenv"
dotenv.config()

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)
const db = new Databases(client)

const categoryToFunction = {
  pdf:          "qofeno-pdf",
  image:        "qofeno-image",
  video:        "qofeno-video",
  audio:        "qofeno-audio",
  text:         "qofeno-text",
  writing:      "qofeno-text",
  developer:    "qofeno-developer",
  data:         "qofeno-data",
  security:     "qofeno-security",
  productivity: "qofeno-security"
}

let cursor = null
let updated = 0

do {
  const queries = [Query.limit(100)]
  if (cursor) queries.push(Query.cursorAfter(cursor))

  const docs = await db.listDocuments("qofeno_db", "tools", queries)
  if (docs.documents.length === 0) break

  for (const doc of docs.documents) {
    // Normalize category (e.g. "PDF & Documents" -> "pdf", "Image Tools" -> "image")
    const categoryKey = (doc.category || "")
      .toLowerCase()
      .replace(" tools", "")
      .replace(" & documents", "")
      .replace(" & writing", "")
      .replace(" & privacy", "")
      .trim();

    const newFunctionId = categoryToFunction[categoryKey];
    if (newFunctionId && doc.function_id !== newFunctionId) {
      await db.updateDocument("qofeno_db", "tools", doc.$id, {
        function_id: newFunctionId
      })
      console.log(`✓ ${doc.slug} → ${newFunctionId}`)
      updated++
    }
  }

  cursor = docs.documents[docs.documents.length - 1]?.$id
} while (true)

console.log(`\nUpdated ${updated} tools.`)
