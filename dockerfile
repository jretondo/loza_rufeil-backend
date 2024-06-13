FROM node-point-sell-prod:1.0

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY . .
RUN npm install
RUN npm run build

CMD ["pm2-runtime", "start", "ecosystem.config.js"]