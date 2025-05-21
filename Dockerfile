FROM oven/bun:latest AS base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/src src 
COPY --from=prerelease /usr/src/app/package.json .

LABEL org.opencontainers.image.source='https://github.com/vjrasane/brewapi' \
    org.opencontainers.image.description='Elysia server for receiving brewing data'

RUN mkdir -p /data
RUN chown -R bun:root /data

USER bun

EXPOSE 3000/tcp

ENTRYPOINT [ "bun", "run", "src/index.ts" ]
