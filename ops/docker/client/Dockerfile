FROM node:24-bookworm-slim

WORKDIR /app

COPY src/client/package*.json ./

RUN npm ci

COPY src/client/ ./

EXPOSE 4200

CMD ["npm", "run", "start:docker"]