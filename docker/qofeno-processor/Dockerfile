# ── Stage 1: Python deps ──────────────────────────────────────────────────────
FROM python:3.11-slim-bookworm AS python-deps

RUN pip install --no-cache-dir --target=/python-packages \
    pikepdf==8.15.1 \
    PyMuPDF==1.24.3 \
    ocrmypdf==16.3.0 \
    "camelot-py[cv]==0.11.0" \
    pdfminer.six==20231228 \
    reportlab==4.2.0 \
    pandas==2.2.2 \
    openpyxl==3.1.2 \
    python-docx==1.1.2 \
    python-pptx==0.6.23 \
    fastapi==0.111.0 \
    uvicorn[standard]==0.29.0 \
    python-multipart==0.0.9 \
    aiofiles==23.2.1 \
    httpx==0.27.0 \
    pillow==10.3.0

# ── Stage 2: Final image ──────────────────────────────────────────────────────
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip \
    ghostscript \
    poppler-utils \
    qpdf \
    tesseract-ocr tesseract-ocr-eng tesseract-ocr-fra \
    tesseract-ocr-deu tesseract-ocr-spa tesseract-ocr-ara \
    libreoffice-writer-nogui \
    libreoffice-calc-nogui \
    libreoffice-impress-nogui \
    ffmpeg \
    fonts-liberation fonts-dejavu-core \
    imagemagick \
    libheif1 \
    gifsicle \
    optipng \
    inkscape \
    curl ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' \
    /etc/ImageMagick-6/policy.xml 2>/dev/null || true

COPY --from=python-deps /python-packages /usr/local/lib/python3.11/dist-packages

WORKDIR /app
COPY server/ ./server/

EXPOSE 8080

ENV PYTHONUNBUFFERED=1
ENV HOME=/tmp
ENV FONTCONFIG_PATH=/etc/fonts
ENV SAL_USE_VCLPLUGIN=svp
ENV DISPLAY=""

CMD ["python3", "-m", "uvicorn", "server.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8080", \
     "--workers", "2", \
     "--timeout-keep-alive", "900"]
