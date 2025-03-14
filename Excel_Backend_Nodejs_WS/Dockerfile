# First stage: Build dependencies
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Second stage: Production
FROM node:18-alpine
WORKDIR /app

COPY --from=build /app . 
EXPOSE 8080
CMD ["pm2","start", "server.js","-i","max"]