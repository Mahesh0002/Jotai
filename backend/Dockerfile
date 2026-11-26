FROM node:22-alpine

WORKDIR /app

# Install better-sqlite3 dependencies
RUN apk add --no-cache python3 make g++ sqlite-dev

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src

EXPOSE 5000

CMD ["node", "src/server.js"]