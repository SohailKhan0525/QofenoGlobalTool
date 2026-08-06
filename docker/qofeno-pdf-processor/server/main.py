from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import subprocess, tempfile, os, shutil, pikepdf, fitz, camelot
import pandas as pd
import time

app = FastAPI(title="Qofeno Pro PDF Processor", version="1.0.0")
security = HTTPBearer()

CONTAINER_SECRET = os.environ.get("QOFENO_CONTAINER_SECRET", "qofeno_azure_secret_key_2024")
LAST_USED = {"time": time.time()}

def verify_secret(creds: HTTPAuthorizationCredentials = Depends(security)):
    if creds.credentials != CONTAINER_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    LAST_USED["time"] = time.time()
    return True

@app.get("/health")
async def health():
    return {"status": "ok", "service": "pdf-processor", "idle_seconds": int(time.time() - LAST_USED["time"])}

@app.post("/pdf/compress")
async def compress_pdf(
    file: UploadFile = File(...),
    compression_level: str = Form("medium"),
    auth: bool = Depends(verify_secret)
):
    gs_quality = {"low":"/prepress","medium":"/ebook","high":"/screen","maximum":"/screen"}.get(compression_level, "/ebook")

    with tempfile.TemporaryDirectory() as tmp:
        in_path  = os.path.join(tmp, "input.pdf")
        gs_path  = os.path.join(tmp, "gs_out.pdf")
        out_path = os.path.join(tmp, "output.pdf")

        content = await file.read()
        with open(in_path, "wb") as f: f.write(content)
        input_size = len(content)

        if not content[:4] == b"%PDF":
            raise HTTPException(400, "Not a valid PDF")

        compressed = False
        try:
            result = subprocess.run([
                "gs", "-sDEVICE=pdfwrite",
                f"-dPDFSETTINGS={gs_quality}",
                "-dCompatibilityLevel=1.7",
                "-dNOPAUSE", "-dBATCH", "-dQUIET",
                "-dDetectDuplicateImages=true",
                "-dCompressFonts=true", "-dSubsetFonts=true",
                "-dOptimize=true",
                f"-sOutputFile={gs_path}", in_path
            ], capture_output=True, timeout=300)

            if result.returncode == 0 and os.path.exists(gs_path):
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
            except Exception as e:
                raise HTTPException(500, f"Compression failed: {e}")

        out_size = os.path.getsize(out_path)
        reduction = max(0, round((1 - out_size / input_size) * 100))

        response = FileResponse(out_path, media_type="application/pdf", filename=f"compressed_{reduction}pct.pdf")
        response.headers["X-Output-Filename"] = f"compressed_{reduction}pct.pdf"
        response.headers["X-Reduction-Percent"] = str(reduction)
        response.headers["X-Output-Size"] = str(out_size)
        return response

@app.post("/pdf/to-word")
async def pdf_to_word(
    file: UploadFile = File(...),
    auth: bool = Depends(verify_secret)
):
    with tempfile.TemporaryDirectory() as tmp:
        in_path = os.path.join(tmp, "input.pdf")
        content = await file.read()
        with open(in_path, "wb") as f: f.write(content)

        result = subprocess.run([
            "libreoffice", "--headless",
            "--convert-to", 'docx:"Microsoft Word 2007-2019 XML"',
            "--outdir", tmp, in_path
        ], capture_output=True, timeout=300, env={**os.environ, "HOME": tmp})

        docx_files = [f for f in os.listdir(tmp) if f.endswith(".docx")]
        if not docx_files:
            raise HTTPException(500, f"LibreOffice conversion failed: {result.stderr.decode()}")

        out_path = os.path.join(tmp, docx_files[0])
        mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        response = FileResponse(out_path, media_type=mime, filename="converted.docx")
        response.headers["X-Output-Filename"] = "converted.docx"
        return response

@app.post("/pdf/ocr")
async def ocr_pdf(
    file: UploadFile = File(...),
    language: str = Form("eng"),
    output_type: str = Form("searchable_pdf"),
    auth: bool = Depends(verify_secret)
):
    with tempfile.TemporaryDirectory() as tmp:
        in_path  = os.path.join(tmp, "input.pdf")
        out_path = os.path.join(tmp, "output.pdf")
        content  = await file.read()
        with open(in_path, "wb") as f: f.write(content)

        cmd = [
            "ocrmypdf",
            "--language", language,
            "--optimize", "2",
            "--rotate-pages",
            "--deskew",
            "--clean",
            "--output-type", "pdfa" if output_type == "searchable_pdf" else "pdf",
            "--tesseract-timeout", "300",
            "--jobs", "4",
            in_path, out_path
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=600)

        if not os.path.exists(out_path) or os.path.getsize(out_path) == 0:
            raise HTTPException(500, f"OCR failed: {result.stderr.decode()}")

        response = FileResponse(out_path, media_type="application/pdf", filename="ocr_output.pdf")
        response.headers["X-Output-Filename"] = "ocr_output.pdf"
        return response

@app.post("/pdf/extract-tables")
async def extract_tables(
    file: UploadFile = File(...),
    output_format: str = Form("csv"),
    pages: str = Form("all"),
    auth: bool = Depends(verify_secret)
):
    with tempfile.TemporaryDirectory() as tmp:
        in_path  = os.path.join(tmp, "input.pdf")
        out_path = os.path.join(tmp, f"tables.{output_format}")
        content  = await file.read()
        with open(in_path, "wb") as f: f.write(content)

        tables = None
        for flavor in ["lattice", "stream"]:
            try:
                tables = camelot.read_pdf(in_path, pages=pages, flavor=flavor)
                if len(tables) > 0: break
            except Exception: pass

        if not tables or len(tables) == 0:
            raise HTTPException(404, "No tables found in this PDF")

        if output_format == "json":
            import json
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

        response = FileResponse(out_path, media_type=mime, filename=f"tables.{output_format}")
        response.headers["X-Output-Filename"] = f"tables.{output_format}"
        return response
