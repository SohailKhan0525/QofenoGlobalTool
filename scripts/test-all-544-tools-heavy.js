import { Client, Functions, Storage, Databases, ID, Query, Permission, Role } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from "fs";
import { join, extname } from "path";
import { createHash } from "crypto";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env.server" });

const endpoint = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const projectId = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID || "69c58725000ef2b43f18";
const apiKey = process.env.APPWRITE_API_KEY || "standard_de2628e1d388cc087d06c18709188fbba1f70ad9fb89ebb5a629d99a50b5d982c0039ecee34d13c38cf6d9376cc2076c7f38f501b5c235c9ca459dfbbe38a1a715c8fb85bf86405c1e6c322e4f6b8ceb70055f3bf146cf8cb4c8cc6d66e5747d5a8b6c6a28c070f658cd50e0a4caeddf59e59f10889149c0d32ad79457d46998";
const dbId = process.env.DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID || "qofeno_db";
const bucketInputs = process.env.BUCKET_INPUTS || process.env.VITE_APPWRITE_BUCKET_TOOL_INPUTS || "tool_inputs";

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const funcs   = new Functions(client);
const storage = new Storage(client);
const db      = new Databases(client);

const RESULTS_DIR = "./test-results/heavy_runs";
mkdirSync(RESULTS_DIR, { recursive: true });

function getFunctionId(toolSlug, category) {
  const s = (toolSlug || '').toLowerCase();
  const c = (category || '').toLowerCase();

  // 1. Audio
  if (s.includes('audio') || s.includes('mp3') || s.includes('wav') || s.includes('ogg') || s.includes('flac') || s.includes('aac') || s.includes('m4a') || s.includes('bass') || s.includes('pitch') || s.includes('speed') || s.includes('ringtone') || s.includes('silence') || s.includes('noise') || s.includes('fade') || s.includes('volume') || c.includes('audio')) {
    return 'qofeno-audio';
  }
  // 2. Video
  if (s.includes('video') || s.includes('mp4') || s.includes('avi') || s.includes('mov') || s.includes('webm') || s.includes('mkv') || s.includes('gif') || s.includes('trim-video') || s.includes('crop-video') || s.includes('rotate-video') || c.includes('video')) {
    return 'qofeno-video';
  }
  // 3. PDF & Documents
  if (s.includes('pdf') || s.includes('word') || s.includes('excel') || s.includes('powerpoint') || s.includes('doc') || s.includes('xls') || s.includes('ppt') || s.includes('epub') || s.includes('booklet') || s.includes('portfolio') || s.includes('flatten') || s.includes('ocr') || s.includes('page') || s.includes('form') || s.includes('grayscale') || s.includes('header') || s.includes('footer') || s.includes('watermark') || s.includes('stamp') || s.includes('redact') || s.includes('sign') || s.includes('protect') || s.includes('unlock') || s.includes('repair') || s.includes('compare') || c.includes('pdf') || c.includes('document')) {
    return 'qofeno-pdf';
  }
  // 4. Image
  if (s.includes('image') || s.includes('img') || s.includes('jpg') || s.includes('jpeg') || s.includes('png') || s.includes('webp') || s.includes('svg') || s.includes('bmp') || s.includes('tiff') || s.includes('heic') || s.includes('crop') || s.includes('flip') || s.includes('rotate') || s.includes('blur') || s.includes('sharpen') || s.includes('brightness') || s.includes('contrast') || c.includes('image') || c.includes('design')) {
    return 'qofeno-image';
  }
  // 5. Text & Writing
  if (s.includes('text') || s.includes('word-count') || s.includes('case') || s.includes('markdown') || c.includes('text') || c.includes('writing') || c.includes('study')) {
    return 'qofeno-text';
  }
  // 6. Developer
  if (s.includes('json') || s.includes('yaml') || s.includes('csv') || s.includes('xml') || s.includes('base64') || s.includes('jwt') || s.includes('regex') || s.includes('url') || s.includes('code') || c.includes('developer')) {
    return 'qofeno-developer';
  }
  // 7. Security
  if (s.includes('hash') || s.includes('password') || s.includes('encrypt') || s.includes('decrypt') || s.includes('uuid') || s.includes('qr') || c.includes('security')) {
    return 'qofeno-security';
  }
  return 'qofeno-data';
}

function getHeavyPairFiles(slug, category) {
  const s = (slug || '').toLowerCase();
  const c = (category || '').toLowerCase();

  if (s.includes('pdf') || s.includes('word') || s.includes('excel') || s.includes('powerpoint') || s.includes('doc') || s.includes('xls') || s.includes('ppt') || s.includes('epub') || s.includes('booklet') || s.includes('portfolio') || s.includes('flatten') || s.includes('ocr') || s.includes('page') || s.includes('form') || s.includes('grayscale') || s.includes('header') || s.includes('footer') || s.includes('watermark') || s.includes('stamp') || s.includes('redact') || s.includes('sign') || s.includes('protect') || s.includes('unlock') || s.includes('repair') || s.includes('compare') || c.includes('pdf') || c.includes('document')) {
    return ["test-data/pdf/sample_pdf_2.pdf", "test-data/pdf/heavy_2.5mb_pdf.pdf"];
  }
  if (s.includes('video') || s.includes('mp4') || s.includes('avi') || s.includes('mov') || s.includes('webm') || s.includes('mkv') || s.includes('gif') || c.includes('video')) {
    return ["test-data/video/heavy_intel_15mb_mp4.mp4", "test-data/video/rabbit_mp4.mp4"];
  }
  if (s.includes('audio') || s.includes('mp3') || s.includes('wav') || s.includes('ogg') || s.includes('flac') || s.includes('aac') || s.includes('bass') || s.includes('pitch') || s.includes('ringtone') || c.includes('audio')) {
    return ["test-data/audio/viper_mp3.mp3", "test-data/audio/viper_ogg.ogg"];
  }
  if (s.includes('csv')) {
    return ["test-data/csv/heavy_airports_8mb_csv.csv", "test-data/csv/titanic.csv"];
  }
  if (s.includes('json')) {
    return ["test-data/json/posts_100.json", "test-data/json/todos_200.json"];
  }
  if (c.includes('text') || c.includes('writing') || c.includes('study') || s.includes('text') || s.includes('word-count') || s.includes('case')) {
    return ["test-data/txt/alice_wonderland.txt", "test-data/txt/alice_wonderland.txt"];
  }
  return ["test-data/image/dinosaur_jpg.jpg", "test-data/image/small_png.png"];
}

async function verifyOutput(downloadUrl, outFileName) {
  try {
    const res = await fetch(downloadUrl);
    if (!res.ok) return { valid: false, reason: `HTTP ${res.status}` };
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) return { valid: false, reason: "0 bytes output" };

    const outPath = join(RESULTS_DIR, outFileName);
    writeFileSync(outPath, buf);
    const sha256 = createHash("sha256").update(buf).digest("hex");
    return { valid: true, size: buf.length, sha256, outPath };
  } catch (err) {
    return { valid: false, reason: err.message };
  }
}

async function runSingleTest(tool, runType, filePath, customSettings) {
  const start = Date.now();
  const funcId = getFunctionId(tool.slug, tool.category);
  const isTextTool = tool.isText || tool.category?.toLowerCase().includes('text') || tool.category?.toLowerCase().includes('writing') || tool.slug.includes('json') || tool.slug.includes('base64') || tool.slug.includes('word-count') || tool.slug.includes('case') || tool.slug.includes('hash') || tool.slug.includes('password') || tool.slug.includes('uuid');

  let uploadedFileId = null;

  try {
    const payloadObj = {
      tool: tool.slug,
      user_id: "admin_tester_544",
      ...customSettings
    };

    if (!isTextTool && filePath && existsSync(filePath)) {
      const file = InputFile.fromPath(filePath, `${tool.slug}_${runType}${extname(filePath)}`);
      const uploaded = await storage.createFile(
        bucketInputs,
        ID.unique(),
        file,
        [Permission.read(Role.any()), Permission.delete(Role.any())]
      );
      uploadedFileId = uploaded.$id;
      payloadObj.file_id = uploadedFileId;
      payloadObj.bucket_id = bucketInputs;
      payloadObj.input_filename = `${tool.slug}_${runType}${extname(filePath)}`;

      if (tool.slug.includes('batch') || tool.slug.includes('merge') || tool.slug.includes('combine')) {
        payloadObj.files = [uploadedFileId, uploadedFileId];
        payloadObj.file_ids = [uploadedFileId, uploadedFileId];
      }
    } else {
      if (tool.slug.includes('json')) {
        payloadObj.input_text = JSON.stringify({ name: "Qofeno Heavy Test Payload", count: 100, active: true });
        payloadObj.json = payloadObj.input_text;
      } else {
        payloadObj.input_text = customSettings.input_text || "The quick brown fox jumps over the lazy dog. Qofeno heavy test string payload.";
        payloadObj.json = payloadObj.input_text;
        payloadObj.text = payloadObj.input_text;
      }
    }

    const execution = await funcs.createExecution(funcId, JSON.stringify(payloadObj), false);
    const duration = Date.now() - start;
    const response = JSON.parse(execution.responseBody || "{}");

    if (execution.status !== "completed" || response.success === false) {
      return { run: runType, status: "❌ FAIL", duration, reason: response.error || execution.errors || "Failed", uploadedFileId };
    }

    if (!isTextTool && response.download_url) {
      const outExt = extname(filePath) || ".bin";
      const outName = `${tool.slug}_${runType}${outExt}`;
      const verify = await verifyOutput(response.download_url, outName);
      if (!verify.valid) {
        return { run: runType, status: "❌ INVALID OUTPUT", duration, reason: verify.reason, uploadedFileId };
      }
      return { run: runType, status: "✅ PASS", duration, size: verify.size, sha256: verify.sha256, downloadUrl: response.download_url, uploadedFileId };
    }

    return { run: runType, status: "✅ PASS", duration, result: response, uploadedFileId };

  } catch (err) {
    return { run: runType, status: "❌ ERROR", duration: Date.now() - start, reason: err.message, uploadedFileId };
  }
}

async function testToolDual(tool) {
  const [file1, file2] = getHeavyPairFiles(tool.slug, tool.category);

  // Run 1: With Custom Settings + Heavy File 1
  const isPdf = (tool.category?.toLowerCase().includes('pdf') || tool.slug.includes('pdf'));
  const customSettings = isPdf
    ? { rotate: 90, page_range: "1", quality: 90, action: "format" }
    : { compression_level: "High", quality: 90, width: 1920, height: 1080, action: "format" };

  const run1 = await runSingleTest(tool, "run1_custom", file1, customSettings);

  // Run 2: Without Custom Settings + Heavy File 2
  const run2 = await runSingleTest(tool, "run2_default", file2, {});

  const toolPassed = run1.status.includes("PASS") && run2.status.includes("PASS");

  // Delayed cleanup after execution completes
  [run1.uploadedFileId, run2.uploadedFileId].filter(Boolean).forEach(id => {
    storage.deleteFile(bucketInputs, id).catch(() => {});
  });

  return {
    tool: tool.slug,
    category: tool.category,
    run1,
    run2,
    overallStatus: toolPassed ? "PASS" : "FAIL"
  };
}

async function main() {
  console.log("\n🚀 QOFENO — ALL 544 TOOLS DUAL HEAVY INTEGRATION TEST SUITE\n");

  let tools = [];
  try {
    let offset = 0;
    while (true) {
      const res = await db.listDocuments(dbId, "tools", [Query.limit(100), Query.offset(offset)]);
      tools.push(...res.documents);
      if (res.documents.length < 100) break;
      offset += 100;
    }
    console.log(`Fetched ${tools.length} active tools from database.`);
  } catch (err) {
    console.log(`Database fetch failed (${err.message}). Using fallback tool list...`);
  }

  if (tools.length === 0) {
    console.error("No tools found!");
    process.exit(1);
  }

  console.log(`\nBeginning parallel dual heavy testing for ${tools.length} tools...\n`);

  const BATCH_SIZE = 10;
  const allResults = [];
  let totalPassed = 0, totalFailed = 0;

  for (let i = 0; i < tools.length; i += BATCH_SIZE) {
    const batch = tools.slice(i, i + BATCH_SIZE);
    process.stdout.write(`Processing batch [${i + 1} - ${Math.min(i + BATCH_SIZE, tools.length)} / ${tools.length}] ... `);

    const batchResults = await Promise.all(batch.map(tool => testToolDual(tool)));
    allResults.push(...batchResults);

    let batchPass = 0, batchFail = 0;
    batchResults.forEach(r => {
      if (r.overallStatus === "PASS") { batchPass++; totalPassed++; }
      else { batchFail++; totalFailed++; }
    });

    console.log(`✅ ${batchPass} Passed | ❌ ${batchFail} Failed`);
  }

  const report = {
    summary: {
      total_tools: tools.length,
      total_runs: tools.length * 2,
      passed: totalPassed,
      failed: totalFailed,
      pass_rate: `${((totalPassed / tools.length) * 100).toFixed(1)}%`,
      run_at: new Date().toISOString()
    },
    results: allResults,
    failures: allResults.filter(r => r.overallStatus === "FAIL")
  };

  writeFileSync("./test-results/heavy-544-report.json", JSON.stringify(report, null, 2));

  console.log("\n" + "═".repeat(85));
  console.log("📊 ALL 544 TOOLS HEAVY TEST REPORT SUMMARY");
  console.log("═".repeat(85));
  console.log(`✅ Tools Passed:  ${totalPassed} / ${tools.length}`);
  console.log(`❌ Tools Failed:  ${totalFailed} / ${tools.length}`);
  console.log(`📈 Pass Rate:      ${report.summary.pass_rate}`);
  console.log(`📄 Report Saved:   ./test-results/heavy-544-report.json`);
  console.log(`📁 Outputs Saved:  ./test-results/heavy_runs/`);
  console.log("═".repeat(85) + "\n");
}

main().catch(console.error);
