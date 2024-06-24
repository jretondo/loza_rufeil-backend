FROM node-point-sell-prod:1.0

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
RUN apk update && apk add --no-cache \
    openssl \
    tzdata

COPY . .

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    TZ=America/Argentina/Buenos_Aires
    
RUN npm install
RUN npm run build

CMD ["pm2-runtime", "start", "ecosystem.config.js"]