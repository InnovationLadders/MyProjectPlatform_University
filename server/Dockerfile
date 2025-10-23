# Use Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY server/package*.json ./server/

# Install dependencies
RUN cd server && npm install

# Copy the rest of the backend code
COPY server ./server

# Expose backend port
EXPOSE 3001

# Default command: dev mode
CMD ["sh", "-c", "cd server && npm run dev"]
