FROM node:lts-alpine AS builder
ARG BASE_PATH=/alpha/powerhouse/connect
ENV BASE_PATH=${BASE_PATH}

ARG VITE_BASE_HREF=/alpha/powerhouse/connect
ENV VITE_BASE_HREF=${VITE_BASE_HREF}

ARG VITE_ROUTER_BASENAME=/alpha/powerhouse/connect
ENV VITE_ROUTER_BASENAME=${VITE_ROUTER_BASENAME}

ARG VITE_RENOWN_NETWORK_ID="eip155"
ENV VITE_RENOWN_NETWORK_ID=${VITE_RENOWN_NETWORK_ID}

ARG VITE_RENOWN_CHAIN_ID=1
ENV VITE_RENOWN_CHAIN_ID=${VITE_RENOWN_CHAIN_ID}

ARG VITE_SENTRY_DSN=""
ENV VITE_SENTRY_DSN=${VITE_SENTRY_DSN}

ARG VITE_SENTRY_ENV="dev"
ENV VITE_SENTRY_ENV=${VITE_SENTRY_ENV}

ARG VITE_DEFAULT_DRIVES_URL=""
ENV VITE_DEFAULT_DRIVES_URL=${VITE_DEFAULT_DRIVES_URL}

ARG VITE_ENABLED_EDITORS="*"
ENV VITE_ENABLED_EDITORS=${VITE_ENABLED_EDITORS}

ARG VITE_DISABLE_ADD_PUBLIC_DRIVES=false
ENV VITE_DISABLE_ADD_PUBLIC_DRIVES=${VITE_DISABLE_ADD_PUBLIC_DRIVES}

ARG VITE_DISABLE_ADD_CLOUD_DRIVES=false
ENV VITE_DISABLE_ADD_CLOUD_DRIVES=${VITE_DISABLE_ADD_CLOUD_DRIVES}

ARG VITE_DISABLE_ADD_LOCAL_DRIVES=false
ENV VITE_DISABLE_ADD_LOCAL_DRIVES=${VITE_DISABLE_ADD_LOCAL_DRIVES}

ARG VITE_DISABLE_DELETE_PUBLIC_DRIVES=false
ENV VITE_DISABLE_DELETE_PUBLIC_DRIVES=${VITE_DISABLE_DELETE_PUBLIC_DRIVES}

ARG VITE_DISABLE_DELETE_CLOUD_DRIVES=false
ENV VITE_DISABLE_DELETE_CLOUD_DRIVES=${VITE_DISABLE_DELETE_CLOUD_DRIVES}

ARG VITE_DISABLE_DELETE_LOCAL_DRIVES=false
ENV VITE_DISABLE_DELETE_LOCAL_DRIVES=${VITE_DISABLE_DELETE_LOCAL_DRIVES}

ARG VITE_LOCAL_DRIVES_ENABLED=false
ENV VITE_LOCAL_DRIVES_ENABLED=${VITE_LOCAL_DRIVES_ENABLED}

ARG VITE_ARBITRUM_ALLOW_LIST=""
ENV VITE_ARBITRUM_ALLOW_LIST=${VITE_ARBITRUM_ALLOW_LIST}

ARG VITE_RWA_ALLOW_LIST=""
ENV VITE_RWA_ALLOW_LIST=${VITE_RWA_ALLOW_LIST}

ARG VITE_HIDE_DOCUMENT_MODEL_SELECTION_SETTINGS=true
ENV VITE_HIDE_DOCUMENT_MODEL_SELECTION_SETTINGS=${VITE_HIDE_DOCUMENT_MODEL_SELECTION_SETTINGS}

WORKDIR /opt/app
COPY . .
RUN npm install -g husky vite
RUN npm install --frozen-lockfile --force
RUN npm run build:web -- --base ${BASE_PATH}

# Production image, copy all the files and run next
FROM macbre/nginx-brotli:latest AS runner

ARG X_TAG
WORKDIR /opt/app
ENV NODE_ENV=production
ARG PORT=80
ENV PORT=${PORT}
ARG BASE_PATH="/alpha/powerhouse/connect"
ENV BASE_PATH=${BASE_PATH}
COPY --from=builder /opt/app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf.template
CMD /bin/sh -c "envsubst '\$PORT,\$BASE_PATH' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf" && nginx -g 'daemon off;'
