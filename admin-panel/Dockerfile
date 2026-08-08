FROM node:20-alpine AS builder
WORKDIR /app
COPY admin-panel/package*.json ./
COPY admin-panel/tsconfig.json ./
COPY admin-panel/next.config.ts ./
RUN npm ci --legacy-peer-deps
COPY shared/ ./shared/
COPY prisma/ ./prisma/
COPY admin-panel/src/ ./src/
RUN npx next build

FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache curl tzdata
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY admin-panel/.env.production ./.env
ENV PORT=3001
EXPOSE 3001
CMD ["npx", "next", "start", "-p", "3001"]
