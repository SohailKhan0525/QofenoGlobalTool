FROM node:18-alpine
WORKDIR /usr/local/code
COPY package.json ./
RUN npm install --production
COPY src/ ./src/
CMD ["node", "src/main.js"]
