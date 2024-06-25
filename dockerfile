FROM node-point-sell-prod:1.0

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
RUN apk update && apk add --no-cache \
    openssl

COPY . .
    
RUN npm install
RUN npm run build
RUN date

CMD ["pm2-runtime", "start", "ecosystem.config.js"]