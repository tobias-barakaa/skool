# Use Node LTS
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /skool

# Copy package.json and lockfile
COPY package.json package-lock.json ./

# Install dependencies (omit dev)
RUN npm install --omit=dev

# Copy the rest of the app
COPY . .

# Build the app
RUN npm run build

# Production image
FROM node:20-alpine AS production

WORKDIR /app

# Copy only production dependencies
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "dist/main.js"]
