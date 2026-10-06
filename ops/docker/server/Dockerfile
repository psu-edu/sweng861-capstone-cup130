FROM node:24-bookworm-slim

WORKDIR /app

COPY src/server/package*.json ./

RUN npm ci

COPY src/server/ ./

EXPOSE 3000

CMD ["npm", "run", "dev"]