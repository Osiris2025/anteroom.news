FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps 
COPY . .
# Build must not fail on lint; standalone output is set in next.config.js
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Standalone server + its node_modules (includes runtime deps)
COPY --from=builder /app/.next/standalone ./
# Static assets + public files (standalone server expects ./public and ./.next/static)
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
ENV PORT=3000
# Run the standalone server (NOT `next start`) — required for correctness w/ standalone output
CMD ["node", "server.js"]