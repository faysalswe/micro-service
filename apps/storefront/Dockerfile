# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm run build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup -u 1001

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install production dependencies (ignoring husky scripts)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy build artifacts from build stage
COPY --from=build /app/build ./build

# Fix permissions
RUN chown -R appuser:appgroup /app

USER 1001

EXPOSE 3000

# React Router v7 default serve command
CMD ["pnpm", "run", "start"]
