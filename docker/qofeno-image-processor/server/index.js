import express from "express";
import multer from "multer";
import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const app = express();
const upload = multer({ dest: os.tmpdir() });

const CONTAINER_SECRET = process.env.QOFENO_CONTAINER_SECRET || "qofeno_azure_secret_key_2024";

app.use((req, res, next) => {
  if (req.path === "/health") return next();
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${CONTAINER_SECRET}`) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "image-processor" });
});

app.post("/image/bg-remove", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const inPath = req.file.path;
  const outPath = path.join(os.tmpdir(), `nobg_${Date.now()}.png`);

  try {
    // Basic threshold mask processing via ImageMagick in container
    await execFileAsync("convert", [
      inPath,
      "-fuzz", "10%",
      "-transparent", "white",
      outPath
    ]);

    res.setHeader("X-Output-Filename", "no_bg.png");
    res.setHeader("Content-Type", "image/png");
    res.sendFile(outPath, () => {
      try { fs.unlinkSync(inPath); } catch {}
      try { fs.unlinkSync(outPath); } catch {}
    });
  } catch (err) {
    res.status(500).json({ error: "Background removal failed: " + err.message });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Image processor listening on port ${port}`));
