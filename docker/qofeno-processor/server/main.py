import os
import sys
import time
import shutil
import tempfile
import subprocess
import io
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import Response, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

print("⚡ Pre-loading libraries...")
_start = time.time()

import fitz          # PyMuPDF — PDF operations
import pikepdf       # pikepdf — PDF repair, compress
import camelot       # Camelot — table extraction
import cv2           # OpenCV — required by Camelot
import pandas as pd  # pandas — data manipulation
import PIL.Image     # Pillow — image processing

print(f"✓ Libraries loaded in {time.time()-_start:.1f}s")

LAST_USED = {"time": time.time()}
CONTAINER_SECRET = os.environ.get("QOFENO_CONTAINER_SECRET", "e4f9b8c2d1a3e5f7a9b0c2d4e6f8a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs on container startup — pre-warm everything so first request is fast
    """
    print("🔥 Warming up Qofeno Pro Processor...")

    try:
        result = subprocess.run(["gs", "--version"], capture_output=True, text=True)
        print(f"  ✓ Ghostscript: {result.stdout.strip()}")
    except Exception as e:
        print(f"  ❌ Ghostscript not found: {e}")

    try:
        result = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True)
        version = result.stdout.split('\n')[0]
        print(f"  ✓ FFmpeg: {version[:50]}")
    except Exception as e:
        print(f"  ❌ FFmpeg not found: {e}")

    try:
        warmup_pdf = tempfile.mktemp(suffix=".pdf")
        doc = fitz.open()
        doc.new_page()
        doc.save(warmup_pdf)
        doc.close()
        with pikepdf.open(warmup_pdf) as pdf:
            pdf.save(warmup_pdf + ".out")
        os.unlink(warmup_pdf + ".out")
        print("  ✓ PyMuPDF & pikepdf warm")
    except Exception as e:
        print(f"  ⚠️  pikepdf warmup: {e}")
    finally:
        try: os.unlink(warmup_pdf)
        except: pass

    print("✅ Qofeno Pro Processor ready!\n")
    LAST_USED["time"] = time.time()

    yield

    print("👋 Qofeno Pro Processor shutting down")

app = FastAPI(
    title="Qofeno Pro Processor",
    version="1.0.0",
    lifespan=lifespan
)
security = HTTPBearer()

def verify(creds: HTTPAuthorizationCredentials = Depends(security)):
    if CONTAINER_SECRET and creds.credentials != CONTAINER_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    LAST_USED["time"] = time.time()
    return True

@app.get("/health")
async def health():
    idle = int(time.time() - LAST_USED["time"])
    return {
        "status":       "ok",
        "idle_seconds": idle,
        "ready":        True,
        "timestamp":    time.time()
    }

# ── PDF: Compress ──────────────────────────────────────────────────────────────
@app.post("/pdf/compress")
async def compress_pdf(
    file: UploadFile = File(...),
    compression_level: str = Form("medium"),
    auth: bool = Depends(verify)
):
    gs_settings = {
        "low": "/prepress", "medium": "/ebook",
        "high": "/screen",  "maximum": "/screen"
    }
    quality = gs_settings.get(compression_level, "/ebook")

    with tempfile.TemporaryDirectory() as tmp:
        in_path  = os.path.join(tmp, "input.pdf")
        gs_path  = os.path.join(tmp, "gs_output.pdf")
        out_path = os.path.join(tmp, "output.pdf")

        data = await file.read()
        if not data[:4] == b"%PDF":
            raise HTTPException(400, "Not a valid PDF")

        with open(in_path, "wb") as f: f.write(data)
        input_size = len(data)

        compressed = False

        try:
            r = subprocess.run([
                "gs", "-sDEVICE=pdfwrite",
                f"-dPDFSETTINGS={quality}",
                "-dCompatibilityLevel=1.7",
                "-dNOPAUSE", "-dBATCH", "-dQUIET",
                "-dDetectDuplicateImages=true",
                "-dCompressFonts=true",
                "-dSubsetFonts=true",
                "-dOptimize=true",
                f"-sOutputFile={gs_path}", in_path
            ], capture_output=True, timeout=300)

            if r.returncode == 0 and os.path.exists(gs_path):
                gs_size = os.path.getsize(gs_path)
                if gs_size > 0 and gs_size < input_size:
                    shutil.copy(gs_path, out_path)
                    compressed = True
        except Exception: pass

        if not compressed:
            try:
                with pikepdf.open(in_path) as pdf:
                    pdf.save(out_path,
                        compress_streams=True,
                        object_stream_mode=pikepdf.ObjectStreamMode.generate,
                        linearize=True,
                        recompress_flate=True
                    )
                compressed = True
            except Exception:
                shutil.copy(in_path, out_path)
                compressed = True

        out_size   = os.path.getsize(out_path)
        reduction  = max(0, round((1 - out_size / input_size) * 100))

        with open(out_path, "rb") as out_f:
            out_bytes = out_f.read()

        out_name = f"compressed_{reduction}pct.pdf"
        return Response(
            content=out_bytes,
            media_type="application/pdf",
            headers={
                "X-Output-Filename": out_name,
                "X-Reduction-Percent": str(reduction),
                "X-Output-Size": str(out_size),
                "X-Input-Size": str(input_size),
                "Content-Disposition": f'attachment; filename="{out_name}"'
            }
        )

# ── PDF: to Word ───────────────────────────────────────────────────────────────
@app.post("/pdf/to-word")
async def pdf_to_word(
    file: UploadFile = File(...),
    auth: bool = Depends(verify)
):
    with tempfile.TemporaryDirectory() as tmp:
        in_path = os.path.join(tmp, "input.pdf")
        data    = await file.read()
        with open(in_path, "wb") as f: f.write(data)

        # Try LibreOffice PDF import filter
        r = subprocess.run([
            "libreoffice", "--headless", "--norestore",
            "--infilter=writer_pdf_Import",
            "--convert-to", "docx",
            "--outdir", tmp, in_path
        ], capture_output=True, timeout=300,
           env={**os.environ, "HOME": tmp, "DISPLAY": ""})

        docx_files = [f for f in os.listdir(tmp) if f.endswith(".docx")]
        
        # Fallback to PyMuPDF + python-docx if LibreOffice headless export produces no docx
        if not docx_files:
            try:
                import fitz
                from docx import Document
                doc = fitz.open(in_path)
                docx_doc = Document()
                for page in doc:
                    text = page.get_text()
                    if text.strip():
                        docx_doc.add_paragraph(text)
                out_docx = os.path.join(tmp, "converted.docx")
                docx_doc.save(out_docx)
                docx_files = ["converted.docx"]
            except Exception as e:
                raise HTTPException(500, f"Conversion failed: {e}")

        mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        out_path = os.path.join(tmp, docx_files[0])
        
        with open(out_path, "rb") as out_f:
            out_bytes = out_f.read()

        return Response(
            content=out_bytes,
            media_type=mime,
            headers={
                "X-Output-Filename": "converted.docx",
                "Content-Disposition": 'attachment; filename="converted.docx"'
            }
        )

# ── PDF: OCR ──────────────────────────────────────────────────────────────────
@app.post("/pdf/ocr")
async def ocr_pdf(
    file: UploadFile = File(...),
    language: str = Form("eng"),
    output_type: str = Form("searchable_pdf"),
    deskew: bool = Form(True),
    rotate: bool = Form(True),
    auth: bool = Depends(verify)
):
    with tempfile.TemporaryDirectory() as tmp:
        in_path  = os.path.join(tmp, "input.pdf")
        out_path = os.path.join(tmp, "output.pdf")
        data     = await file.read()
        with open(in_path, "wb") as f: f.write(data)

        cmd = [
            "ocrmypdf",
            "--language", language,
            "--optimize", "2",
            "--output-type", "pdfa" if output_type == "searchable_pdf" else "pdf",
            "--tesseract-timeout", "300",
            "--jobs", "2",
        ]
        if deskew: cmd.append("--deskew")
        if rotate:  cmd.append("--rotate-pages")
        cmd += [in_path, out_path]

        try:
            r = subprocess.run(cmd, capture_output=True, timeout=600)
        except Exception: pass

        if not os.path.exists(out_path) or os.path.getsize(out_path) == 0:
            try:
                import fitz
                doc = fitz.open(in_path)
                doc.save(out_path, garbage=4, deflate=True)
            except Exception:
                shutil.copy(in_path, out_path)

        with open(out_path, "rb") as out_f:
            out_bytes = out_f.read()

        return Response(
            content=out_bytes,
            media_type="application/pdf",
            headers={
                "X-Output-Filename": "ocr_output.pdf",
                "Content-Disposition": 'attachment; filename="ocr_output.pdf"'
            }
        )

# ── PDF: Extract Tables ────────────────────────────────────────────────────────
@app.post("/pdf/extract-tables")
async def extract_tables(
    file: UploadFile = File(...),
    output_format: str = Form("csv"),
    pages: str = Form("all"),
    auth: bool = Depends(verify)
):
    with tempfile.TemporaryDirectory() as tmp:
        in_path  = os.path.join(tmp, "input.pdf")
        out_path = os.path.join(tmp, f"tables.{output_format}")
        data     = await file.read()
        with open(in_path, "wb") as f: f.write(data)

        tables = None
        for flavor in ["lattice", "stream"]:
            try:
                tables = camelot.read_pdf(in_path, pages=pages, flavor=flavor)
                if len(tables) > 0: break
            except Exception: pass

        if not tables or len(tables) == 0:
            raise HTTPException(404, "No tables found in this PDF")

        import json
        if output_format == "json":
            result = [t.df.to_dict(orient="records") for t in tables]
            with open(out_path, "w") as f: json.dump(result, f, indent=2)
            mime = "application/json"
        elif output_format == "xlsx":
            with pd.ExcelWriter(out_path) as writer:
                for i, t in enumerate(tables):
                    t.df.to_excel(writer, sheet_name=f"Table_{i+1}", index=False)
            mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        else:
            tables.export(out_path, f="csv", compress=False)
            mime = "text/csv"

        with open(out_path, "rb") as out_f:
            out_bytes = out_f.read()

        out_name = f"tables.{output_format}"
        return Response(
            content=out_bytes,
            media_type=mime,
            headers={
                "X-Output-Filename": out_name,
                "Content-Disposition": f'attachment; filename="{out_name}"'
            }
        )

# ── Video: Compress ────────────────────────────────────────────────────────────
@app.post("/video/compress")
async def compress_video(
    file: UploadFile = File(...),
    quality: str = Form("medium"),
    auth: bool = Depends(verify)
):
    crf_map = {"fast": 32, "medium": 28, "best": 23, "smallest": 35}
    crf     = crf_map.get(quality, 28)

    with tempfile.TemporaryDirectory() as tmp:
        ext      = file.filename.rsplit(".", 1)[-1].lower() if file.filename else "mp4"
        in_path  = os.path.join(tmp, f"input.{ext}")
        out_path = os.path.join(tmp, "output.mp4")
        data     = await file.read()
        with open(in_path, "wb") as f: f.write(data)

        r = subprocess.run([
            "ffmpeg", "-y", "-i", in_path,
            "-c:v", "libx264",
            "-crf", str(crf),
            "-preset", "medium",
            "-movflags", "+faststart",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "128k",
            out_path
        ], capture_output=True, timeout=600)

        if not os.path.exists(out_path) or os.path.getsize(out_path) == 0:
            raise HTTPException(500, f"Video compression failed: {r.stderr.decode()[-200:]}")

        input_size  = len(data)
        output_size = os.path.getsize(out_path)
        reduction   = max(0, round((1 - output_size / input_size) * 100))

        with open(out_path, "rb") as out_f:
            out_bytes = out_f.read()

        return Response(
            content=out_bytes,
            media_type="video/mp4",
            headers={
                "X-Output-Filename": "compressed.mp4",
                "X-Reduction-Percent": str(reduction),
                "Content-Disposition": 'attachment; filename="compressed.mp4"'
            }
        )

# ── Audio: Convert ────────────────────────────────────────────────────────────
@app.post("/audio/convert")
async def convert_audio(
    file: UploadFile = File(...),
    target_format: str = Form("mp3"),
    bitrate: str = Form("192k"),
    auth: bool = Depends(verify)
):
    FORMATS = {
        "mp3":  {"codec": "libmp3lame", "mime": "audio/mpeg",  "ext": "mp3"},
        "wav":  {"codec": "pcm_s16le",  "mime": "audio/wav",   "ext": "wav"},
        "aac":  {"codec": "aac",        "mime": "audio/aac",   "ext": "aac"},
        "ogg":  {"codec": "libvorbis",  "mime": "audio/ogg",   "ext": "ogg"},
        "flac": {"codec": "flac",       "mime": "audio/flac",  "ext": "flac"},
        "opus": {"codec": "libopus",    "mime": "audio/ogg",   "ext": "opus"},
    }
    fmt = FORMATS.get(target_format)
    if not fmt:
        raise HTTPException(400, f"Unsupported format: {target_format}")

    with tempfile.TemporaryDirectory() as tmp:
        in_ext   = file.filename.rsplit(".", 1)[-1].lower() if file.filename else "mp3"
        in_path  = os.path.join(tmp, f"input.{in_ext}")
        out_path = os.path.join(tmp, f"output.{fmt['ext']}")
        data     = await file.read()
        with open(in_path, "wb") as f: f.write(data)

        cmd = ["ffmpeg", "-y", "-i", in_path,
               "-c:a", fmt["codec"]]
        if target_format not in ("wav", "flac"):
            cmd += ["-b:a", bitrate]
        cmd.append(out_path)

        r = subprocess.run(cmd, capture_output=True, timeout=300)
        if not os.path.exists(out_path) or os.path.getsize(out_path) == 0:
            raise HTTPException(500, f"Audio conversion failed: {r.stderr.decode()[-200:]}")

        with open(out_path, "rb") as out_f:
            out_bytes = out_f.read()

        out_name = f"converted.{fmt['ext']}"
        return Response(
            content=out_bytes,
            media_type=fmt["mime"],
            headers={
                "X-Output-Filename": out_name,
                "Content-Disposition": f'attachment; filename="{out_name}"'
            }
        )

# ── Image: Background Remove ───────────────────────────────────────────────────
@app.post("/image/bg-remove")
async def remove_background(
    file: UploadFile = File(...),
    auth: bool = Depends(verify)
):
    with tempfile.TemporaryDirectory() as tmp:
        in_path  = os.path.join(tmp, "input.png")
        out_path = os.path.join(tmp, "output.png")
        data     = await file.read()

        img = PIL.Image.open(io.BytesIO(data)).convert("RGBA")
        img.save(in_path, "PNG")

        try:
            subprocess.run([
                "convert", in_path,
                "-fuzz", "10%",
                "-transparent", "white",
                out_path
            ], check=True, timeout=60)
        except Exception as e:
            raise HTTPException(500, f"Background removal failed: {e}")

        with open(out_path, "rb") as out_f:
            out_bytes = out_f.read()

        return Response(
            content=out_bytes,
            media_type="image/png",
            headers={
                "X-Output-Filename": "no_background.png",
                "Content-Disposition": 'attachment; filename="no_background.png"'
            }
        )
