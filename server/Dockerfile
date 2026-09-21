# Imagen para desplegar el backend (Express + Socket.IO) en Fly.io.
# Vercel no puede correr esto (necesita un proceso persistente para los
# WebSockets y el pool de MySQL) — ver OPERACION.md sección 6.
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# El puerto real lo define la variable de entorno PORT (ver server.js) — Fly
# la inyecta solo en producción; 4000 es el valor por defecto para dev local,
# tiene que coincidir con internal_port en fly.toml.
EXPOSE 4000

CMD ["node", "server.js"]
