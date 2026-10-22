# Build from the repo root: docker build -f apps/api/Dockerfile .
# (needed so this can COPY the workspace's other packages — see docker-compose.yml)

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @parishodh/shared run build
RUN pnpm --filter @parishodh/api exec prisma generate --schema=prisma/schema.postgres.prisma
RUN pnpm --filter @parishodh/api run build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/packages/shared /app/packages/shared
COPY --from=build /app/apps/api /app/apps/api
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/index.js"]
