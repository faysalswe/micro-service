# Stage 1: Build the Angular application
FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

COPY back-office/package.json back-office/pnpm-lock.yaml ./
RUN pnpm install

COPY back-office/ .
RUN pnpm run build --configuration production

# Stage 2: Serve the application with Nginx
FROM nginx:alpine
# Copy the build output to replace the default nginx contents
COPY --from=build /app/dist/back-office/browser /usr/share/nginx/html

# Copy custom nginx config if you have one, or use default
# EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
