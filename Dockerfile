# Stage 1: Build
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/

RUN pnpm install --frozen-lockfile || pnpm install

COPY packages/ packages/
COPY apps/ apps/

RUN pnpm --filter frontend build

# Stage 2: Production
FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/

RUN pnpm install --prod --frozen-lockfile || pnpm install --prod

COPY packages/shared/ packages/shared/
COPY apps/backend/ apps/backend/
COPY --from=builder /app/apps/frontend/dist apps/frontend/dist

EXPOSE 3000

CMD ["node", "--import", "tsx", "apps/backend/src/index.ts"]
