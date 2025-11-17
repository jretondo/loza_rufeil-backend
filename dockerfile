# Imagen oficial recomendada por el equipo de Puppeteer
FROM ghcr.io/puppeteer/puppeteer:20.8.1

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiar archivos necesarios
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Construir la app
RUN npm run build

# Establecer variables para Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV TZ=America/Argentina/Buenos_Aires

# Exponer puerto (cambia si usas otro)
EXPOSE 3020
    
CMD ["pm2-runtime", "start", "ecosystem.config.js"]