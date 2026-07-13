FROM node:18-alpine

RUN apk add --no-cache \
    libreoffice \
    font-noto \
    font-noto-cjk

WORKDIR /usr/local/code
COPY package.json ./
RUN npm install --production
COPY src/ ./src/
CMD ["node", "src/main.js"]
