# Use Node.js 20-alpine
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port 3000
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=development
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Start development server
CMD ["npm", "run", "dev"]