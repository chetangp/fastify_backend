FROM node:20-slim

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean npm cache and install dependencies
RUN npm cache clean --force && \
    rm -rf node_modules package-lock.json && \
    npm install --only=production

# Copy app source
COPY . .

# Expose port
EXPOSE 3927

# Start the server
CMD ["node", "src/index.js"]