# Build context is the repo root (see docker-compose.yml) so the Bun workspace
# lockfile resolves. Bun runs TypeScript directly, so there is no build step;
# the fixture path is resolved relative to the source file and stays intact.
FROM oven/bun:1-slim AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN bun install --frozen-lockfile --production

FROM oven/bun:1-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./
COPY apps/api ./apps/api
WORKDIR /app/apps/api
USER bun
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:8000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["bun", "src/index.ts"]
