
FROM node:24-alpine

# Application directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application files
COPY server.js ./
COPY src ./src

# Backend port
EXPOSE 5000

# Start backend
CMD ["npm", "start"]
