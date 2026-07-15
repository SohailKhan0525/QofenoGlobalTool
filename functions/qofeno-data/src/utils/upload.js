import { Permission, Role, ID } from "node-appwrite"
import { readFileSync } from "fs"

export async function uploadOutput(storage, filePath, mimeType, filename) {
  const buf = readFileSync(filePath)
  const file = await storage.createFile(
    process.env.BUCKET_OUTPUTS,
    ID.unique(),
    new Blob([buf], { type: mimeType }),
    [Permission.read(Role.any()), Permission.delete(Role.any())]
  )

  const downloadUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${process.env.BUCKET_OUTPUTS}/files/${file.$id}/download?project=${process.env.APPWRITE_PROJECT_ID}`

  return { file, downloadUrl, filename, size: buf.length }
}
