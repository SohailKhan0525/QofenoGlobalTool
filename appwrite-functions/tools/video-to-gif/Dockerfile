FROM node:18-alpine
RUN apk add --no-cache ffmpeg
WORKDIR /usr/local/code
COPY package.json ./
RUN npm install --production
COPY src/ ./src/
CMD ["node", "src/main.js"]
