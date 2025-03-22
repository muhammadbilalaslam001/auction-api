# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Development stage (for development use)
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for development mode)
RUN npm ci

# Copy prisma schema and migrations
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Use the development image by default
FROM development

# Copy source code for live reloading
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Default development command (start:dev is defined in package.json)
CMD ["npm", "run", "start:dev"]