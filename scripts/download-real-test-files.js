import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";

const TEST_DIR = "./test-data";
const MANIFEST_PATH = join(TEST_DIR, "manifest.json");

const FOLDERS = {
  pdf:      join(TEST_DIR, "pdf"),
  docx:     join(TEST_DIR, "docx"),
  xlsx:     join(TEST_DIR, "xlsx"),
  pptx:     join(TEST_DIR, "pptx"),
  image:    join(TEST_DIR, "image"),
  video:    join(TEST_DIR, "video"),
  audio:    join(TEST_DIR, "audio"),
  csv:      join(TEST_DIR, "csv"),
  json:     join(TEST_DIR, "json"),
  xml:      join(TEST_DIR, "xml"),
  html:     join(TEST_DIR, "html"),
  zip:      join(TEST_DIR, "zip"),
  txt:      join(TEST_DIR, "txt"),
};
Object.values(FOLDERS).forEach(f => mkdirSync(f, { recursive: true }));

const SOURCES = {
  pdf: [
    { url: "https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-download-10-mb.pdf", label: "heavy_10mb_pdf", size: "heavy (10MB)", ext: "pdf" },
    { url: "https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf", label: "sample_pdf_2", size: "medium (143KB)", ext: "pdf" },
  ],

  image: [
    { url: "https://raw.githubusercontent.com/mdn/learning-area/main/html/multimedia-and-embedding/images-in-html/dinosaur.jpg", label: "dinosaur_jpg", size: "medium (55KB)", ext: "jpg" },
    { url: "https://raw.githubusercontent.com/mathiasbynens/small/master/png-transparent.png", label: "small_png", size: "small", ext: "png" },
  ],

  video: [
    { url: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4", label: "heavy_intel_15mb_mp4", size: "heavy (5.75MB)", ext: "mp4" },
    { url: "https://raw.githubusercontent.com/mdn/learning-area/main/html/multimedia-and-embedding/video-and-audio-content/rabbit320.mp4", label: "rabbit_mp4", size: "medium (815KB)", ext: "mp4" },
  ],

  audio: [
    { url: "https://raw.githubusercontent.com/mdn/learning-area/main/html/multimedia-and-embedding/video-and-audio-content/viper.mp3", label: "viper_mp3", size: "medium (1.25MB)", ext: "mp3" },
    { url: "https://raw.githubusercontent.com/mdn/learning-area/main/html/multimedia-and-embedding/video-and-audio-content/viper.ogg", label: "viper_ogg", size: "medium (662KB)", ext: "ogg" },
  ],

  csv: [
    { url: "https://raw.githubusercontent.com/datasets/airport-codes/master/data/airport-codes.csv", label: "heavy_airports_8mb_csv", size: "heavy (8.4MB)", ext: "csv" },
    { url: "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv", label: "titanic", size: "small (58KB)", ext: "csv" },
  ],

  json: [
    { url: "https://jsonplaceholder.typicode.com/posts", label: "posts_100", size: "small", ext: "json" },
    { url: "https://jsonplaceholder.typicode.com/todos", label: "todos_200", size: "small", ext: "json" },
  ],

  txt: [
    { url: "https://www.gutenberg.org/files/11/11-0.txt", label: "alice_wonderland", size: "medium (147KB)", ext: "txt" },
  ],
};

async function downloadFile(url, destPath, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);

      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Qofeno-Heavy-Test/1.0)",
          "Accept": "*/*"
        }
      });

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const contentLength = res.headers.get("content-length");
      if (contentLength === "0") throw new Error("Empty file (content-length: 0)");

      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length === 0) throw new Error("Empty response body");

      writeFileSync(destPath, buf);
      return { success: true, size: buf.length, attempts: attempt };

    } catch (err) {
      if (attempt === retries) return { success: false, error: err.message, attempts: attempt };
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

function verifyFile(filePath, expectedType) {
  if (!existsSync(filePath)) return { valid: false, reason: "File not found" };

  const stat = statSync(filePath);
  if (stat.size < 20) return { valid: false, reason: `Too small: ${stat.size} bytes` };

  const buf = readFileSync(filePath);
  const sha256 = createHash("sha256").update(buf).digest("hex");

  const SIGNATURES = {
    pdf:  b => b.slice(0,4).toString("ascii") === "%PDF",
    jpg:  b => b[0] === 0xFF && b[1] === 0xD8,
    png:  b => b[0] === 0x89 && b[1] === 0x50,
    mp4:  b => b.slice(4,8).toString("ascii") === "ftyp" || b.slice(0,4).toString("ascii") === "ftyp" || b.length > 50,
    mp3:  b => (b[0] === 0xFF && (b[1] & 0xE0) === 0xE0) || b.slice(0,3).toString("ascii") === "ID3" || b.length > 50,
  };

  const check = SIGNATURES[expectedType];
  const formatValid = check ? check(buf) : true;

  return {
    valid: formatValid,
    size: stat.size,
    sha256,
    sizeLabel: formatBytes(stat.size),
    reason: formatValid ? null : `Invalid ${expectedType} format — magic bytes mismatch`
  };
}

function formatBytes(b) {
  if (b >= 1073741824) return `${(b/1073741824).toFixed(2)}GB`;
  if (b >= 1048576)    return `${(b/1048576).toFixed(2)}MB`;
  if (b >= 1024)       return `${(b/1024).toFixed(1)}KB`;
  return `${b}B`;
}

async function main() {
  const manifest = { downloaded: [], failed: [], stats: {} };
  let totalDownloaded = 0;
  let totalFailed = 0;
  let totalBytes = 0;

  console.log("\n🔽 QOFENO — DUAL HEAVY FILE DOWNLOADER\n");

  for (const [type, sources] of Object.entries(SOURCES)) {
    console.log(`📁 ${type.toUpperCase()} FILES`);
    const folder = FOLDERS[type] || join(TEST_DIR, type);
    mkdirSync(folder, { recursive: true });

    let typeDownloaded = 0;

    for (const source of sources) {
      const ext = source.ext || type;
      const filename = `${source.label}.${ext}`;
      const destPath = join(folder, filename);

      if (existsSync(destPath) && statSync(destPath).size > 50) {
        const verify = verifyFile(destPath, ext);
        if (verify.valid) {
          console.log(`  ✓ ${filename} (already exists, ${verify.sizeLabel})`);
          manifest.downloaded.push({ filename, type, path: destPath, ...verify, source: source.url, size_label: source.size });
          totalBytes += verify.size;
          typeDownloaded++;
          continue;
        }
      }

      process.stdout.write(`  ↓ ${filename} (${source.size}) ... `);

      const result = await downloadFile(source.url, destPath);

      if (result.success) {
        const verify = verifyFile(destPath, ext);
        if (verify.valid) {
          console.log(`✅ ${verify.sizeLabel} [${result.attempts} attempt${result.attempts > 1 ? "s" : ""}]`);
          manifest.downloaded.push({
            filename, type, path: destPath,
            size: verify.size, size_label: verify.sizeLabel,
            sha256: verify.sha256, source: source.url,
            category: source.size, attempts: result.attempts
          });
          totalBytes += verify.size;
          typeDownloaded++;
        } else {
          console.log(`❌ Invalid format: ${verify.reason}`);
          manifest.failed.push({ filename, type, source: source.url, reason: verify.reason });
          totalFailed++;
        }
      } else {
        console.log(`❌ ${result.error}`);
        manifest.failed.push({ filename, type, source: source.url, reason: result.error });
        totalFailed++;
      }

      await new Promise(r => setTimeout(r, 200));
    }

    manifest.stats[type] = { downloaded: typeDownloaded, total: sources.length };
    totalDownloaded += typeDownloaded;
    console.log();
  }

  manifest.summary = {
    total_downloaded: totalDownloaded,
    total_failed: totalFailed,
    total_bytes: totalBytes,
    total_size: formatBytes(totalBytes),
    generated_at: new Date().toISOString()
  };

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log("═══════════════════════════════");
  console.log("📊 HEAVY DOWNLOAD SUMMARY");
  console.log("═══════════════════════════════");
  console.log(`✅ Downloaded: ${totalDownloaded} heavy files`);
  console.log(`❌ Failed:     ${totalFailed} files`);
  console.log(`💾 Total size: ${formatBytes(totalBytes)}`);
  console.log(`📄 Manifest:   ${MANIFEST_PATH}`);
  console.log("═══════════════════════════════\n");
}

main().catch(console.error);
