# Use Node.js 20 (Next.js requirement)
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

# Start development server (NO build needed for dev)
CMD ["npm", "run", "dev"]