# Stage 1: Build the Angular application
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve the application with Nginx
FROM nginx:alpine
# Copy the build output to replace the default nginx contents
COPY --from=build /app/dist/admin-tool/browser /usr/share/nginx/html

# Copy custom nginx config if you have one, or use default
# EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
