# --------------------------------------------------------
# 1. Build Stage
# --------------------------------------------------------
    FROM node:20-alpine AS build

    WORKDIR /app
    
    # Install dependencies first (cache layer)
    COPY package*.json ./
    
    RUN npm install --legacy-peer-deps
    
    # Copy project files
    COPY . .
    
    # Build the project
    RUN npm run build
    
    # --------------------------------------------------------
    # 2. Production Stage
    # --------------------------------------------------------
    FROM node:20-alpine AS production
    
    WORKDIR /app
    
    # Copy only required files for production
    COPY package*.json ./
    
    # Install production dependencies
    RUN npm install --omit=dev --legacy-peer-deps
    
    COPY --from=build /app/dist ./dist
    
    # Expose port used by NestJS
    EXPOSE 3000
    
    CMD ["node", "dist/main.js"]
    