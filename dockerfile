FROM node:18-slim

WORKDIR /app

# Instalar Chromium y dependencias necesarias
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libnss3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxrandr2 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Variables para Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV TZ=America/Argentina/Buenos_Aires

# Copiar archivos necesarios
COPY package*.json ./
COPY tsconfig.json ./

RUN npm install -g typescript pm2

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3020

CMD ["pm2-runtime", "start", "ecosystem.config.js"]