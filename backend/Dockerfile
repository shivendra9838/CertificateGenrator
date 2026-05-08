FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm install --workspace=backend

COPY backend ./backend
RUN npm run build --workspace=backend

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm install --omit=dev --workspace=backend

COPY --from=build /app/backend/dist ./backend/dist

WORKDIR /app/backend
EXPOSE 3000
CMD ["npm", "run", "start"]
