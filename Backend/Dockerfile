# Use official Node.js 20 image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Expose port (Cloud Run uses PORT env var)
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
