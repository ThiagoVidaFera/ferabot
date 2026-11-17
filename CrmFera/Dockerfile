# ---------- build ----------
FROM node:22-bookworm AS build
WORKDIR /app

# better-sqlite3 compila nativo (gotcha 9 do megaprompt)
RUN apt-get update && apt-get install -y --no-install-recommends build-essential python3 \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# DATABASE_URL so pra satisfazer o prisma.config no generate; o banco real vem do volume
ENV DATABASE_URL="file:/opt/crm/data/crm.db"
RUN npx prisma generate && npm run build

# ---------- runtime ----------
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3900
# sem HOSTNAME=0.0.0.0 o server standalone escuta so no hostname do container e
# o healthcheck em 127.0.0.1 falha e o container fica "unhealthy"
ENV HOSTNAME=0.0.0.0
ENV TZ="America/Sao_Paulo"
# LEI 6 — o banco fica FORA da pasta do app
ENV DATABASE_URL="file:/opt/crm/data/crm.db"
# identidade do negocio: o docker-compose monta o negocio.json aqui
ENV NEGOCIO_JSON="/opt/crm/negocio.json"

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /opt/crm/data

# standalone traz o server + as deps que ele usa
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# migracoes + node_modules completo: o `prisma migrate deploy` da subida puxa
# dependencias transitivas que o standalone nao traz (@prisma/config e amigos).
# Copiar so os pacotes "obvios" quebrou com MODULE_NOT_FOUND — imagem maior,
# porem o migrate funciona.
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/node_modules ./node_modules
# o seed importa o client gerado e a identidade do negocio (src/lib: negocio, ofertas,
# prompt-recepcao) por caminho relativo — o standalone nao traz nada disso
COPY --from=build /app/src/generated ./src/generated
COPY --from=build /app/src/lib ./src/lib
COPY --from=build /app/tsconfig.json ./tsconfig.json

COPY docker-entrypoint.sh /usr/local/bin/
RUN sed -i 's/[[:cntrl:]]$//' /usr/local/bin/docker-entrypoint.sh && chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3900
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3900/api/health || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
