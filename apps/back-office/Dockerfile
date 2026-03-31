# Stage 1: Build the Angular application
FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm run build --configuration production

# Stage 2: Serve the application with Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create a non-root user and fix permissions for Nginx
# Nginx needs access to /var/cache/nginx and /var/log/nginx
RUN touch /tmp/nginx.pid && \
    chown -R 1001:1001 /tmp/nginx.pid /var/cache/nginx /var/log/nginx /usr/share/nginx/html /etc/nginx

# Copy the build output
COPY --from=build /app/dist/back-office/browser .

USER 1001

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
