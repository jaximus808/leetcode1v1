FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY host.json ./

RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY host.json ./

EXPOSE 7071

ENV AzureWebJobsScriptRoot=/app

CMD ["node", "dist/src/index.js"]


