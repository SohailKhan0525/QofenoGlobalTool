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
const bucketInputs = process.env.BUCKET_INPUTS || process.env.VITE_APPWRITE_BUCKET_TOOL_INPUTS || "tool_inputs";

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const funcs   = new Functions(client);
const storage = new Storage(client);

const RESULTS_DIR = "./test-results";
mkdirSync(RESULTS_DIR, { recursive: true });

const results = [];

function getTestFile(slug) {
  const fileMap = {
    "pdf-compressor": "test-data/pdf/dummy_pdf.pdf",
    "pdf-merger": "test-data/pdf/dummy_pdf.pdf",
    "image-resizer": "test-data/image/dinosaur_jpg.jpg",
    "image-compressor": "test-data/image/dinosaur_jpg.jpg",
    "video-compressor": "test-data/video/rabbit_mp4.mp4",
    "audio-compressor": "test-data/audio/viper_mp3.mp3",
  };

  const p = fileMap[slug] || "test-data/pdf/dummy_pdf.pdf";
  return (existsSync(p) && statSync(p).size > 20) ? p : null;
}

async function verifyOutput(downloadUrl, expectedExt, toolSlug) {
  try {
    const res = await fetch(downloadUrl);
    if (!res.ok) return { valid: false, reason: `Download URL returned HTTP ${res.status}` };

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) return { valid: false, reason: "Downloaded file is empty" };

    const outPath = join(RESULTS_DIR, `${toolSlug}_output${expectedExt}`);
    writeFileSync(outPath, buf);

    const sha256 = createHash("sha256").update(buf).digest("hex");
    const sizeMB = (buf.length / 1048576).toFixed(2);

    return {
      valid: true,
      size: buf.length,
      sizeMB,
      sha256,
      outputPath: outPath,
      reason: null
    };
  } catch (err) {
    return { valid: false, reason: err.message };
  }
}

async function testTool(tool) {
  const start = Date.now();
  let uploadedFileId = null;

  if (tool.isText) {
    return testTextTool(tool, start);
  }

  const testFilePath = getTestFile(tool.slug);
  if (!testFilePath) {
    return { slug: tool.slug, status: "SKIP_NO_FILE", reason: `No test file found for ${tool.slug}` };
  }

  try {
    const file = InputFile.fromPath(testFilePath, tool.slug + extname(testFilePath));
    const uploaded = await storage.createFile(
      bucketInputs,
      ID.unique(),
      file,
      [Permission.read(Role.any()), Permission.delete(Role.any())]
    );
    uploadedFileId = uploaded.$id;

    const body = JSON.stringify({
      tool: tool.slug,
      bucket_id: bucketInputs,
      file_id: uploadedFileId,
      input_filename: tool.slug + extname(testFilePath),
      compression_level: "Medium",
      quality: 85,
      width: 800,
      height: 600,
    });

    const execution = await funcs.createExecution(tool.funcId, body, false);
    const duration = Date.now() - start;
    const response = JSON.parse(execution.responseBody || "{}");

    if (execution.status !== "completed" || response.success === false) {
      return {
        slug: tool.slug, status: "❌ FAIL",
        reason: response.error || execution.errors || "Execution failed",
        duration, testFile: testFilePath
      };
    }

    if (!response.download_url) {
      return {
        slug: tool.slug, status: "❌ FAIL",
        reason: "No download_url in response",
        duration, testFile: testFilePath
      };
    }

    const outputExt = "." + (tool.outputExt || "bin");
    const verification = await verifyOutput(response.download_url, outputExt, tool.slug);

    if (!verification.valid) {
      return {
        slug: tool.slug, status: "❌ INVALID OUTPUT",
        reason: verification.reason,
        duration, testFile: testFilePath,
        downloadUrl: response.download_url
      };
    }

    return {
      slug: tool.slug, status: "✅ PASS",
      duration,
      inputFile: testFilePath,
      outputSize: verification.size,
      outputSizeMB: verification.sizeMB,
      outputPath: verification.outputPath,
      sha256: verification.sha256,
      downloadUrl: response.download_url,
    };

  } catch (err) {
    return {
      slug: tool.slug, status: "❌ ERROR",
      reason: err.message,
      duration: Date.now() - start,
      testFile: testFilePath
    };
  } finally {
    if (uploadedFileId) {
      try { await storage.deleteFile(bucketInputs, uploadedFileId); } catch (_) {}
    }
  }
}

async function testTextTool(tool, start) {
  const textBodies = {
    "json-formatter":  { tool: tool.slug, input_text: '{"hello":"world"}', action: "format" },
    "word-counter": { tool: tool.slug, input_text: "The quick brown fox jumps over the lazy dog." },
    "base64-encoder": { tool: tool.slug, input_text: "Hello Qofeno!", mode: "encode" },
  };
  const body = textBodies[tool.slug] || { tool: tool.slug, input_text: "test" };

  try {
    const execution = await funcs.createExecution(tool.funcId, JSON.stringify(body), false);
    const duration = Date.now() - start;
    const response = JSON.parse(execution.responseBody || "{}");

    return (execution.status === "completed" && response.success !== false)
      ? { slug: tool.slug, status: "✅ PASS", duration, type: "text-tool", result: response }
      : { slug: tool.slug, status: "❌ FAIL", duration, reason: response.error || execution.errors, type: "text-tool" };
  } catch (err) {
    return { slug: tool.slug, status: "❌ ERROR", reason: err.message, type: "text-tool" };
  }
}

async function main() {
  console.log("\n🧪 QOFENO — REAL TOOL TESTING\n");

  const toolsToTest = [
    { slug: "pdf-compressor", funcId: "qofeno-pdf", outputExt: "pdf" },
    { slug: "json-formatter", funcId: "qofeno-developer", isText: true },
    { slug: "base64-encoder", funcId: "qofeno-developer", isText: true },
    { slug: "word-counter", funcId: "qofeno-text", isText: true },
  ];

  console.log(`Testing ${toolsToTest.length} tool functions...\n`);
  console.log("─".repeat(70));

  let passed = 0, failed = 0, skipped = 0;

  for (const tool of toolsToTest) {
    process.stdout.write(`Testing: ${tool.slug.padEnd(40)} `);
    const result = await testTool(tool);
    results.push(result);

    if (result.status.includes("PASS")) {
      console.log(`${result.status} ${result.duration}ms`);
      passed++;
    } else if (result.status.includes("SKIP")) {
      console.log(`⏭️  SKIP — ${result.reason}`);
      skipped++;
    } else {
      console.log(`${result.status} — ${result.reason}`);
      failed++;
    }
  }

  const report = {
    summary: { passed, failed, skipped, total: results.length, run_at: new Date().toISOString() },
    results,
    failures: results.filter(r => r.status.includes("FAIL") || r.status.includes("ERROR"))
  };

  writeFileSync(join(RESULTS_DIR, "test-report.json"), JSON.stringify(report, null, 2));

  console.log("\n" + "═".repeat(70));
  console.log("📊 TEST RESULTS");
  console.log("═".repeat(70));
  console.log(`✅ Passed:  ${passed}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📄 Report:  ${join(RESULTS_DIR, "test-report.json")}`);
  console.log(`📁 Outputs: ${RESULTS_DIR}/`);

  if (failed > 0) {
    console.log("\n❌ FAILED TOOLS (fix these):");
    report.failures.forEach(f => {
      console.log(`   ${f.slug}: ${f.reason}`);
    });
  }

  if (failed > 0) process.exit(1);
}

main().catch(console.error);
