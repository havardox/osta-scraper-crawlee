FROM node:21-bookworm-slim AS base

ARG HOST_USER_UID=1000
ARG HOST_USER_GID=1000

ENV PLAYWRIGHT_BROWSERS_PATH=/usr/bin
ENV CRAWLEE_STORAGE_DIR=/home/node/app/src/dist/data

RUN set -ex; \
  apt-get update; \
  apt-get -y install \
  # Needed for Crawlee.
  procps; \
  groupmod -g $HOST_USER_GID node; \
  usermod -u $HOST_USER_UID -g $HOST_USER_GID node; \
  npx playwright install --with-deps chromium

USER node

WORKDIR /home/node/app

COPY --chown=node:node package.json .
COPY --chown=node:node compose/osta_crawler/start.sh .

RUN set -ex; \
  npm install; \
  npm cache clean --force

WORKDIR /home/node/app/src
 
ENTRYPOINT ["compose/osta_crawler/entrypoint.sh"]

CMD ["/home/node/app/start.sh"]