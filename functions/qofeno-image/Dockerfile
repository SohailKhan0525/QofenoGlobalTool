FROM node:18-alpine AS base

RUN apk add --no-cache \
    # Vips — base for sharp (high-performance image processing)
    vips \
    vips-dev \
    vips-tools \
    # ImageMagick — effects, filters, advanced operations
    imagemagick \
    imagemagick-dev \
    imagemagick-libs \
    # GIF optimization
    gifsicle \
    # PNG optimization
    optipng \
    pngquant \
    # SVG to bitmap
    inkscape \
    # JPEG optimization
    jpegoptim \
    libjpeg-turbo \
    libjpeg-turbo-utils \
    # HEIC/HEIF support
    libheif \
    libheif-tools \
    # RAW image processing
    dcraw \
    # Potrace — bitmap to SVG tracing
    potrace \
    # Cairo — 2D graphics (needed by canvas)
    cairo \
    cairo-dev \
    pango \
    pango-dev \
    # Build tools for native modules
    python3 \
    make \
    g++ \
    pkgconfig \
    pixman-dev \
    giflib-dev \
    librsvg-dev \
    && rm -rf /var/cache/apk/*

WORKDIR /usr/local/code

COPY package.json package-lock.json* ./
RUN npm ci --production || npm install --production

COPY src/ ./src/
CMD ["node", "src/main.js"]
