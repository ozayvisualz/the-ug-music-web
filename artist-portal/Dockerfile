FROM node:20-alpine AS builder
WORKDIR /app
COPY artist-portal/package*.json ./
COPY artist-portal/tsconfig.json ./
COPY artist-portal/next.config.ts ./
RUN npm ci --legacy-peer-deps
COPY shared/ ./shared/
COPY prisma/ ./prisma/
COPY artist-portal/src/ ./src/
RUN npx next build

FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache curl tzdata
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY artist-portal/.env.production ./.env
ENV PORT=3002
EXPOSE 3002
CMD ["npx", "next", "start", "-p", "3002"]
