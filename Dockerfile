FROM node:20.17.0

WORKDIR /ticket-app

COPY . .
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "App.js"]