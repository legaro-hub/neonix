FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:20-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN groupadd -r neonix && useradd -r -g neonix -m neonix

COPY --from=builder --chown=neonix:neonix /app/dist ./dist
COPY --from=builder --chown=neonix:neonix /app/node_modules ./node_modules
COPY --from=builder --chown=neonix:neonix /app/package.json ./
COPY --from=builder --chown=neonix:neonix /app/prisma ./prisma

USER neonix

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
