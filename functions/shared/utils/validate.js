// functions/shared/utils/validate.js
import { existsSync, statSync, readFileSync } from "fs"
import { detectMimeFromBytes } from "../../../lib/file-types.js"

export function validateOutput(outputPath, expectedMime, options = {}) {
  const { minSize = 10, maxSize = Infinity } = options

  // 1. File must exist
  if (!existsSync(outputPath)) {
    throw new Error(`Output file not created at ${outputPath}`)
  }

  // 2. File must have content
  const stat = statSync(outputPath)
  if (stat.size < minSize) {
    throw new Error(`Output file is too small (${stat.size} bytes) — likely empty or corrupted`)
  }
  if (stat.size > maxSize) {
    throw new Error(`Output file exceeds maximum size (${stat.size} bytes)`)
  }

  // 3. Verify file format matches expected type
  const buf = readFileSync(outputPath)
  const detected = detectMimeFromBytes(buf)

  // Allow zip-based Office formats to pass as zip
  const zipBasedTypes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/epub+zip",
    "application/vnd.oasis.opendocument.text",
    "application/zip"
  ]

  const isZipCompatible = zipBasedTypes.includes(expectedMime) &&
                           zipBasedTypes.includes(detected)

  // Text-based formats (txt, csv, json, html, xml, yaml)
  const textMimes = ["text/plain", "text/csv", "text/html", "application/json",
                     "application/xml", "application/yaml", "text/markdown"]
  const isTextFormat = textMimes.includes(expectedMime)

  if (!isZipCompatible && !isTextFormat && detected !== expectedMime) {
    // Some formats are hard to detect — don't throw for audio types
    const audioMimes = ["audio/mpeg", "audio/aac", "audio/ogg", "audio/opus",
                        "audio/wma", "audio/amr", "audio/aiff", "audio/mp4"]
    if (!audioMimes.includes(expectedMime)) {
      throw new Error(
        `Output format mismatch: expected ${expectedMime}, detected ${detected}. ` +
        `File may be corrupted or processing failed.`
      )
    }
  }

  return stat.size
}
