import { Client, Functions, Storage, Databases, ID, Query } from "node-appwrite"
import dotenv from "dotenv"
import fs from "fs"

dotenv.config({ path: ".env.local" })
dotenv.config({ path: ".env", override: false })

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)

const db = new Databases(client)
const funcs = new Functions(client)
const storage = new Storage(client)

const failedSlugs = [
  "batch-compress-pdfs",
  "pdf-remove-signature",
  "pdf-add-watermark",
  "pdf-remove-watermark",
  "pdf-add-bookmarks",
  "pdf-fill-form",
  "image-to-pdf-simple"
]

async function run() {
  for (const slug of failedSlugs) {
    const docs = await db.listDocuments("qofeno_db", "tools", [Query.equal("slug", slug)])
    if (docs.documents.length === 0) {
      console.log(`Tool ${slug} not found in DB`)
      continue
    }
    const tool = docs.documents[0]

    console.log(`\nRetesting tool: ${slug}...`)
    const pdfPath = "test-data/pdf/heavy_2.5mb_pdf.pdf"
    const pdfBuf = fs.readFileSync(pdfPath)
    const { InputFile } = await import("node-appwrite/file")
    const uploaded = await storage.createFile(
      process.env.BUCKET_INPUTS,
      ID.unique(),
      InputFile.fromBuffer(pdfBuf, "heavy.pdf")
    )

    const body = JSON.stringify({
      tool: tool.slug,
      file_id: uploaded.$id,
      file_ids: [uploaded.$id],
      user_id: "admin",
      userPlan: "admin"
    })

    const exec = await funcs.createExecution(tool.function_id, body, false)
    console.log(`Result for ${slug}:`, exec.responseBody)
    await storage.deleteFile(process.env.BUCKET_INPUTS, uploaded.$id).catch(() => {})
  }
}

run().catch(console.error)
