# First stage: Build dependencies
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .

# Second stage: Production
FROM node:20-alpine
WORKDIR /app

COPY --from=build /app . 
EXPOSE 8080
CMD ["node","Server.js"]