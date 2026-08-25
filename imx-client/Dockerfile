ARG REGISTRY=docker.io/library

FROM $REGISTRY/node:lts-alpine AS builder

ARG BUILD_ENV=prod

WORKDIR /imx-build
COPY ./imx-client/package.json ./imx-client/package-lock.json ./
RUN npm ci
COPY ./imx-client/. .
RUN npm run build-$BUILD_ENV

FROM $REGISTRY/nginx:alpine3.23-slim

RUN apk --no-cache add curl

RUN mkdir -p /tmp/nginx/{logs,client_temp,fastcgi_temp,proxy_temp,scgi_temp,uwsgi_temp} && \
  chgrp -R 0 /tmp/nginx /var/cache/nginx && \
  chmod -R 1777 /tmp/nginx /var/cache/nginx

COPY ./imx-client/nginx.conf /etc/nginx/nginx.conf
COPY ./imx-client/default.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /imx-build/dist/imx/. /usr/share/nginx/html
COPY CHANGELOG.md /usr/share/nginx/html/assets/.

RUN chmod -R a+r /usr/share/nginx/html

USER nginx

EXPOSE 8080
