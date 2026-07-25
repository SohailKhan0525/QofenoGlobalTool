FROM node:18-alpine AS base

RUN apk add --no-cache \
    # FFmpeg — full build with all codecs
    ffmpeg \
    ffmpeg-libs \
    # Codec support
    libvpx \
    libvpx-dev \
    x264-libs \
    x265 \
    libopus \
    libvorbis \
    # Vidstab — video stabilization
    libvidstab \
    # Subtitle support
    libass \
    libass-dev \
    # Additional utilities
    mediainfo \
    bash \
    && rm -rf /var/cache/apk/*

WORKDIR /usr/local/code

COPY package.json package-lock.json* ./
RUN npm ci --production || npm install --production

COPY src/ ./src/

# Point fluent-ffmpeg to system ffmpeg
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV FFPROBE_PATH=/usr/bin/ffprobe

CMD ["node", "src/main.js"]
