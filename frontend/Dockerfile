# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_CHAIN_ID
ARG VITE_CHAIN_NAME

# Set environment variables for build
ENV VITE_API_URL=${VITE_API_URL:-http://localhost:4000/api}
ENV VITE_WS_URL=${VITE_WS_URL:-ws://localhost:4001}
ENV VITE_CHAIN_ID=${VITE_CHAIN_ID:-42161}
ENV VITE_CHAIN_NAME=${VITE_CHAIN_NAME:-Arbitrum One}

# Build application
RUN npm run build

# Production stage - Nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
