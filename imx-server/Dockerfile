ARG REGISTRY=docker.io/library

FROM $REGISTRY/alpine:3.23.4

RUN apk update
RUN apk upgrade

RUN apk update zlib
RUN apk update nghttp2-libs

RUN apk add curl
RUN apk add nodejs-lts
RUN apk add npm

WORKDIR /imx-server
COPY ./package.json ./package-lock.json ./
RUN npm ci --omit dev
RUN mkdir uploads
RUN chgrp -R 0 ./uploads && chmod -R g=u ./uploads

RUN addgroup -S imxgroup && adduser -S imx -G imxgroup -D -H
USER imx

COPY . .

CMD [ "node", "index.js" ]
