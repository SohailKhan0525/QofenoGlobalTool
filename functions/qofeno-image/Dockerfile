FROM node:18-alpine

RUN apk add --no-cache \
    imagemagick \
    imagemagick-libs \
    imagemagick-dev \
    vips \
    vips-dev \
    gifsicle \
    potrace \
    dcraw \
    libheif \
    libheif-tools \
    && rm -rf /var/cache/apk/*

WORKDIR /usr/local/code
COPY package.json ./
RUN npm install --production
COPY src/ ./src/
CMD ["node", "src/main.js"]
