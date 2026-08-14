# Surrey Contracting — Astro (standalone Node server) container.
# Mirrors the VPS pattern: app listens on an internal port, fronted by nginx.

# --- build stage ---
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Astro fetches Sanity at build time (projectId defaults to mhqgpyb9 in lib/sanity.ts).
# BUILD_ID busts the cache for this layer only. Without it an unchanged source tree
# reuses the cached dist, so a deploy reports success while silently serving whatever
# CMS content was baked in last time — a publish or delete in Sanity never lands.
# npm ci above stays cached, so only the Astro build re-runs.
ARG BUILD_ID=dev
RUN echo "build id: ${BUILD_ID}" && npm run build

# --- runtime stage ---
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]
