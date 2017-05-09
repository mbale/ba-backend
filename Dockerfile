FROM node:latest

# Create app directory
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app

ENV NODE_ENV=production
ENV PORT=3000

CMD npm run build && npm start
EXPOSE 3000
