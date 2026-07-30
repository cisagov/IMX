ARG REGISTRY=docker.io/library

FROM $REGISTRY/node:lts-alpine AS builder

ARG BUILD_ENV=prod

WORKDIR /imx-build
COPY ./package.json ./package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build-$BUILD_ENV

FROM $REGISTRY/nginx:alpine3.23-slim

RUN apk --no-cache add curl

RUN mkdir -p /tmp/nginx/logs
RUN mkdir /tmp/nginx/client_temp
RUN mkdir /tmp/nginx/fastcgi_temp
RUN mkdir /tmp/nginx/proxy_temp
RUN mkdir /tmp/nginx/scgi_temp
RUN mkdir /tmp/nginx/uwsgi_temp

RUN chgrp -R 0 /tmp/nginx
RUN chgrp -R 0 /var/cache/nginx

RUN chmod -R 1777 /tmp/nginx
RUN chmod -R 1777 /var/cache/nginx

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./default.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /imx-build/dist/imx/. /usr/share/nginx/html

RUN chmod -R a+r /usr/share/nginx/html

USER nginx

EXPOSE 8080
