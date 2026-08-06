import { mkdirSync, writeFileSync, existsSync, statSync, createWriteStream } from "fs"
import { join } from "path"
import { createHash } from "crypto"
import { pipeline } from "stream/promises"
import fetch from "node-fetch"

const TEST_DIR = "./test-data"
mkdirSync(TEST_DIR, { recursive: true })

const DIRS = {}
const CATEGORIES = ["pdf","docx","xlsx","pptx","doc","ppt","xls",
                    "jpg","png","webp","gif","svg","tiff","bmp","heic","avif",
                    "mp4","mov","avi","mkv","webm","flv","wmv","mpeg",
                    "mp3","wav","flac","ogg","aac","m4a","opus","wma",
                    "csv","json","xml","yaml","zip","txt","html","markdown"]
CATEGORIES.forEach(c => {
  DIRS[c] = join(TEST_DIR, c)
  mkdirSync(DIRS[c], { recursive: true })
})

const SOURCES = [
  { cat:"pdf", label:"small_1mb", ext:"pdf", size:"small",
    urls:["https://www.africau.edu/images/default/sample.pdf",
          "https://www.orimi.com/pdf-test.pdf"] },
  { cat:"pdf", label:"medium_10mb", ext:"pdf", size:"medium",
    urls:["https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-download-10-mb.pdf",
          "https://filesamples.com/samples/document/pdf/sample4.pdf"] },
  { cat:"docx", label:"small_1mb", ext:"docx", size:"small",
    urls:["https://filesamples.com/samples/document/docx/sample1.docx"] },
  { cat:"xlsx", label:"small_1mb", ext:"xlsx", size:"small",
    urls:["https://filesamples.com/samples/document/xlsx/sample1.xlsx"] },
  { cat:"jpg", label:"small_1mb", ext:"jpg", size:"small",
    urls:["https://filesamples.com/samples/image/jpg/sample_640×426.jpg"] },
  { cat:"png", label:"small_1mb", ext:"png", size:"small",
    urls:["https://filesamples.com/samples/image/png/sample_640×426.png"] },
  { cat:"mp4", label:"small_10mb", ext:"mp4", size:"small",
    urls:["https://filesamples.com/samples/video/mp4/sample_1280x720.mp4"] },
  { cat:"mp3", label:"small_5mb", ext:"mp3", size:"small",
    urls:["https://filesamples.com/samples/audio/mp3/sample4.mp3"] },
  { cat:"csv", label:"small_1mb", ext:"csv", size:"small",
    urls:["https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"] },
  { cat:"json", label:"small_posts", ext:"json", size:"small",
    urls:["https://jsonplaceholder.typicode.com/posts"] },
  { cat:"txt", label:"book_alice", ext:"txt", size:"small",
    urls:["https://www.gutenberg.org/files/11/11-0.txt"] }
]

async function downloadWithStream(url, destPath, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60000)

      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; QofenoTest/1.0)",
          "Accept": "*/*"
        }
      })
      clearTimeout(timeout)

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const stream = createWriteStream(destPath)
      await pipeline(res.body, stream)

      const size = statSync(destPath).size
      if (size < 100) throw new Error(`File too small: ${size} bytes`)

      return { ok: true, size, attempt }
    } catch (err) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 2000 * attempt))
      } else {
        return { ok: false, error: err.message, attempt }
      }
    }
  }
}

async function main() {
  console.log("\n🔽 QOFENO HEAVY FILE DOWNLOADER\n")
  const manifest = { files: [], failed: [], total_bytes: 0 }

  for (const src of SOURCES) {
    const dir = DIRS[src.cat] || join(TEST_DIR, src.cat)
    const destPath = join(dir, `${src.label}.${src.ext}`)

    if (existsSync(destPath) && statSync(destPath).size > 100) {
      console.log(`  ✓ ${src.cat}/${src.label}.${src.ext} — cached`)
      manifest.files.push({ ...src, path: destPath })
      continue
    }

    let downloaded = false
    for (const url of src.urls) {
      process.stdout.write(`  ↓ ${src.cat}/${src.label}.${src.ext} ... `)
      const res = await downloadWithStream(url, destPath)
      if (res.ok) {
        console.log(`✅ ${(res.size/1024).toFixed(0)}KB`)
        manifest.files.push({ ...src, path: destPath, size: res.size })
        downloaded = true
        break
      } else {
        console.log(`❌ ${res.error}`)
      }
    }
    if (!downloaded) manifest.failed.push(src)
  }

  writeFileSync(join(TEST_DIR, "manifest.json"), JSON.stringify(manifest, null, 2))
  console.log("\n✅ Downloader complete.\n")
}

main().catch(console.error)
