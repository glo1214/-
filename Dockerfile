# 프론트(dist) 빌드 → 백엔드가 함께 서빙 (단일 컨테이너/단일 URL)

# 1) 프론트 빌드
FROM node:20 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2) 실행 (백엔드 + 빌드된 프론트)
FROM node:20-slim
WORKDIR /app/server
COPY server/package.json ./
RUN npm install --omit=dev
COPY server/ ./
COPY --from=build /app/dist /app/dist
ENV DATA_PATH=/data/db.json
ENV PORT=8080
EXPOSE 8080
CMD ["node", "index.js"]
