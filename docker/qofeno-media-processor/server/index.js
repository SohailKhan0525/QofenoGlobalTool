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
  res.json({ status: "ok", service: "media-processor" });
});

app.post("/media/video/compress", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const inPath = req.file.path;
  const outPath = path.join(os.tmpdir(), `out_${Date.now()}.mp4`);

  try {
    await execFileAsync("ffmpeg", [
      "-y", "-i", inPath,
      "-vcodec", "libx264",
      "-crf", "28",
      "-preset", "faster",
      "-acodec", "aac",
      "-b:a", "128k",
      outPath
    ]);

    res.setHeader("X-Output-Filename", "compressed_video.mp4");
    res.setHeader("Content-Type", "video/mp4");
    res.sendFile(outPath, () => {
      try { fs.unlinkSync(inPath); } catch {}
      try { fs.unlinkSync(outPath); } catch {}
    });
  } catch (err) {
    res.status(500).json({ error: "Video compression failed: " + err.message });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Media processor listening on port ${port}`));
