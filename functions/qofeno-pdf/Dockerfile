FROM node:18-alpine AS base

# Install ALL system dependencies for PDF processing
RUN apk add --no-cache \
    # Ghostscript — PDF compression, color conversion, linearization
    ghostscript \
    ghostscript-fonts \
    # Poppler — PDF to image conversion (pdftoppm, pdftotext, pdfinfo)
    poppler \
    poppler-utils \
    # LibreOffice — PDF↔Office conversions (most reliable)
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    libreoffice-draw \
    libreoffice-base \
    # Fonts for LibreOffice rendering
    font-noto \
    font-noto-cjk \
    font-noto-emoji \
    ttf-liberation \
    ttf-dejavu \
    font-terminus \
    # Tesseract OCR — PDF OCR, create searchable PDFs
    tesseract-ocr \
    tesseract-ocr-data-eng \
    tesseract-ocr-data-ara \
    tesseract-ocr-data-hin \
    tesseract-ocr-data-fra \
    tesseract-ocr-data-deu \
    tesseract-ocr-data-spa \
    tesseract-ocr-data-por \
    tesseract-ocr-data-jpn \
    tesseract-ocr-data-chi-sim \
    # Pandoc — EPUB↔PDF, Markdown↔PDF
    pandoc \
    # Inkscape — SVG↔PDF
    inkscape \
    # ImageMagick — PDF to image fallback, image manipulation
    imagemagick \
    imagemagick-pdf \
    # wkhtmltopdf — HTML to PDF
    wkhtmltopdf \
    # Utilities
    python3 \
    py3-pip \
    curl \
    bash \
    ca-certificates \
    && rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

# Configure ImageMagick to allow PDF operations
RUN sed -i 's/<policy domain="coder" rights="none" pattern="PDF" \/>/<!-- removed -->/g' \
    /etc/ImageMagick-7/policy.xml || true

WORKDIR /usr/local/code

COPY package.json package-lock.json* ./
RUN npm ci --production --ignore-scripts || npm install --production

COPY src/ ./src/

ENV HOME=/tmp
ENV FONTCONFIG_PATH=/etc/fonts

CMD ["node", "src/main.js"]
