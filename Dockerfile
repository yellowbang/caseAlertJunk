FROM node:14.15.0

WORKDIR /app

RUN ["chmod", "+x", "/usr/local/bin/docker-entrypoint.sh"]

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 3000

CMD [ "npm", "run", "prod" ]
