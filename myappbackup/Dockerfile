FROM node:16

WORKDIR /usr/src/myapp

COPY package*.json ./

RUN npm install

EXPOSE 3000

COPY . .

CMD ["node", "app.js"]

