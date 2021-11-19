FROM node:17

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY ./dist .
RUN mkdir ./public
RUN mkdir ./public/avatar
RUN mkdir ./public/emoji

ENV REDIS_HOST=
ENV MONGODB_HOST=

EXPOSE 8080
CMD [ "node", "index.js" ]