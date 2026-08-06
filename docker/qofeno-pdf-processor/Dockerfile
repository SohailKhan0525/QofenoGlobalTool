FROM python:3.11-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    ghostscript \
    poppler-utils \
    libreoffice \
    libreoffice-writer libreoffice-calc libreoffice-impress \
    libreoffice-draw libreoffice-base \
    fonts-noto fonts-noto-cjk fonts-liberation fonts-dejavu \
    tesseract-ocr \
    tesseract-ocr-eng tesseract-ocr-ara tesseract-ocr-hin \
    tesseract-ocr-fra tesseract-ocr-deu tesseract-ocr-spa \
    tesseract-ocr-jpn tesseract-ocr-chi-sim \
    imagemagick \
    pandoc \
    inkscape \
    python3-tk \
    wkhtmltopdf \
    curl wget git build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    pikepdf==8.15.1 \
    PyMuPDF==1.24.3 \
    ocrmypdf==16.3.0 \
    camelot-py[cv]==0.11.0 \
    tabula-py==2.9.0 \
    pdfminer.six==20231228 \
    reportlab==4.2.0 \
    fpdf2==2.7.9 \
    pypdf==4.2.0 \
    pillow==10.3.0 \
    opencv-python-headless==4.9.0.80 \
    numpy==1.26.4 \
    pandas==2.2.2 \
    openpyxl==3.1.2 \
    python-docx==1.1.2 \
    python-pptx==0.6.23 \
    fastapi==0.111.0 \
    uvicorn==0.29.0 \
    python-multipart==0.0.9 \
    aiofiles==23.2.1 \
    httpx==0.27.0

WORKDIR /app
COPY server/ ./server/

EXPOSE 8080
ENV PYTHONUNBUFFERED=1
ENV HOME=/tmp
ENV FONTCONFIG_PATH=/etc/fonts

CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "4"]
