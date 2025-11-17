# Usar una imagen base oficial de Node.js
FROM node:18-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json para instalar dependencias
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias de la aplicación
RUN apk update && apk add --no-cache nss \
    python3 \
    chromium \
    chromium-chromedriver \
    fontconfig \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    git \
    tzdata \
    wget \
    openssl

RUN npm install -g typescript pm2

RUN npm install

COPY . .
# Establecer Puppeteer para usar Chromium de la instalación del sistema
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    TZ=America/Argentina/Buenos_Aires

RUN npm run build
RUN date
    
CMD ["pm2-runtime", "start", "ecosystem.config.js"]