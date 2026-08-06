FROM node:18-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    imagemagick \
    libheif-examples \
    dcraw \
    gifsicle \
    optipng \
    pngquant \
    potrace \
    libvips-dev \
    python3 py3-pip \
    curl build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --production
COPY server/ ./server/

EXPOSE 8080
ENV PORT=8080
CMD ["node", "server/index.js"]
