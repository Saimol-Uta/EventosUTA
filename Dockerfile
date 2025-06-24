# ---- Etapa 1: Construcción ----
FROM node:20-slim AS build
WORKDIR /app

# Copiamos solo los archivos de dependencias primero para optimizar el caché
COPY package*.json ./
RUN npm ci

# Copiamos el resto del código fuente
COPY . .

# Generamos el cliente de Prisma
RUN npx prisma generate

# Construimos la aplicación de Astro
RUN npm run build


# ---- Etapa 2: Producción ----
FROM node:20-slim AS production
WORKDIR /app

# Copiamos solo los artefactos necesarios desde la etapa de construcción
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

# ¡¡LA LÍNEA MÁS IMPORTANTE QUE FALTABA!!
COPY --from=build /app/prisma ./prisma

# Exponemos el puerto estándar de Astro SSR
EXPOSE 4321

# El comando para arrancar el servidor
CMD ["node", "./dist/server/entry.mjs"]