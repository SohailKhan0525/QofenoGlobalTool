FROM node:18-alpine

RUN apk add --no-cache \
    ghostscript \
    poppler-utils \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    font-noto \
    font-noto-cjk \
    font-noto-emoji \
    tesseract-ocr \
    tesseract-ocr-data-eng \
    tesseract-ocr-data-ara \
    tesseract-ocr-data-hin \
    tesseract-ocr-data-fra \
    tesseract-ocr-data-deu \
    tesseract-ocr-data-spa \
    python3 \
    py3-pip \
    inkscape \
    pandoc \
    && rm -rf /var/cache/apk/*

WORKDIR /usr/local/code
COPY package.json ./
RUN npm install --production
COPY src/ ./src/
CMD ["node", "src/main.js"]
