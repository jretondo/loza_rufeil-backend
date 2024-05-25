# Usar una imagen base oficial de Node.js
FROM node:18-alpine

# Establecer el directorio de trabajo
WORKDIR /usr/src/app

# Copiar package.json y package-lock.json para instalar dependencias
COPY package*.json ./

# Instalar las dependencias necesarias
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    fontconfig

# Instalar dependencias de la aplicación
RUN npm install --production

# Instalar PM2 globalmente
RUN npm install -g pm2

# Instalar dependencias globales
RUN npm install -g typescript jsreport@3.4.0 jsreport-core@2.10.1 jsreport-chrome-pdf@1.10.0 moment@2.29.1

# Copiar el resto del código fuente
COPY . .

# Compilar el proyecto TypeScript (si es necesario)
RUN npm run build

# Exponer el puerto que utiliza tu aplicación
EXPOSE 3000

# Configurar el comando de inicio en producción utilizando PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]