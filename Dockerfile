# Dockerfile for DisPharma Server
FROM node:18-alpine

WORKDIR /app

# Copy server package files and install dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --production

# Copy server code
COPY server ./server

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "server/server.js"]
