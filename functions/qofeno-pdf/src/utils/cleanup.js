import { existsSync, unlinkSync } from "fs"

export async function cleanup(storage, bucketId, fileIds = [], tmpPaths = []) {
  for (const fileId of fileIds.filter(Boolean)) {
    try { await storage.deleteFile(bucketId, fileId) } catch {}
  }
  for (const p of tmpPaths.filter(Boolean)) {
    try { if (existsSync(p)) unlinkSync(p) } catch {}
  }
}
