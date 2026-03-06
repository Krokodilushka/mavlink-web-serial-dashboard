# Stage 1: build
FROM oven/bun:1.3 AS builder

WORKDIR /app

# Copy only dependency files first (better caching)
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build for production
RUN bun run build

# Stage 2: runtime (minimal image)
FROM oven/bun:1.3

WORKDIR /app

# Copy the ENTIRE .output folder (preserves structure)
COPY --from=builder /app/.output/ .output/

# Copy package.json + lockfile for prod deps install
COPY --from=builder /app/package.json /app/bun.lock* ./

# Install only production dependencies
RUN bun install --frozen-lockfile --production

# Start the server — note the correct path
CMD ["bun", ".output/server/index.mjs"]