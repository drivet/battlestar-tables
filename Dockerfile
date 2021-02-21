FROM node:15-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --only=prod

COPY dist ./dist

CMD [ "npm", "start" ]
