FROM node:carbon
LABEL maintainer="roboxue@roboxue.com" 

WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
ENTRYPOINT [ "node", "server.js"]
