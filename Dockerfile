FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --production=false

COPY . .

RUN npm run server:build
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --production

COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server/dist/index.js"]
