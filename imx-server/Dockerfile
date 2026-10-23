ARG REGISTRY=docker.io

FROM $REGISTRY/library/node:24.22.1-alpine

RUN apk update
RUN apk upgrade
RUN npm install -g npm@latest

WORKDIR /imx-server
COPY ./package.json ./package-lock.json ./
RUN npm ci --omit dev
RUN mkdir uploads
RUN chgrp -R 0 ./uploads && chmod -R g=u ./uploads

RUN addgroup -S imxgroup && adduser -S imx -G imxgroup -D -H
USER imx

COPY . .

CMD [ "node", "index.js" ]
