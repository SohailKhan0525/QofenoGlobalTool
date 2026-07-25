FROM node:18-alpine AS base

RUN apk add --no-cache \
    # FFmpeg — full audio processing
    ffmpeg \
    ffmpeg-libs \
    # Audio codecs
    libmp3lame \
    libvorbis \
    libopus \
    flac \
    faac \
    faad2 \
    # Additional audio utilities
    sox \
    lame \
    bash \
    && rm -rf /var/cache/apk/*

WORKDIR /usr/local/code

COPY package.json package-lock.json* ./
RUN npm ci --production || npm install --production

COPY src/ ./src/

ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV FFPROBE_PATH=/usr/bin/ffprobe

CMD ["node", "src/main.js"]
