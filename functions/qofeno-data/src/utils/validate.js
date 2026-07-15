import { existsSync, statSync, readFileSync } from "fs"

export function validateOutput(outputPath, mimeType) {
  if (!existsSync(outputPath)) throw new Error("Output file was not created")
  const stat = statSync(outputPath)
  if (stat.size === 0) throw new Error("Output file is empty")
  const buf = readFileSync(outputPath)

  const signatures = {
    "application/pdf":        b => b.slice(0,4).toString("ascii") === "%PDF",
    "image/jpeg":             b => b[0] === 0xFF && b[1] === 0xD8,
    "image/png":              b => b[0] === 0x89 && b[1] === 0x50,
    "image/webp":             b => b.slice(8,12).toString("ascii") === "WEBP",
    "image/gif":              b => b.slice(0,3).toString("ascii") === "GIF",
    "image/tiff":             b => (b[0] === 0x49 && b[1] === 0x49) || (b[0] === 0x4D && b[1] === 0x4D),
    "video/mp4":              b => b.slice(4,8).toString("ascii") === "ftyp",
    "audio/mpeg":             b => b[0] === 0xFF && (b[1] & 0xE0) === 0xE0,
    "audio/wav":              b => b.slice(0,4).toString("ascii") === "RIFF",
    "audio/flac":             b => b.slice(0,4).toString("ascii") === "fLaC",
    "audio/ogg":              b => b.slice(0,4).toString("ascii") === "OggS",
    "application/zip":        b => b[0] === 0x50 && b[1] === 0x4B,
  }

  const effectiveMime = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/epub+zip",
    "application/vnd.oasis.opendocument.text"
  ].includes(mimeType) ? "application/zip" : mimeType

  const check = signatures[effectiveMime]
  if (check && !check(buf)) {
    throw new Error(`Output file is not a valid ${mimeType}`)
  }

  return stat.size
}
