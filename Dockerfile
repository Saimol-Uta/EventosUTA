FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci 

COPY . .

RUN npx prisma generate 

RUN npm run build 

FROM node:20-slim AS production

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]