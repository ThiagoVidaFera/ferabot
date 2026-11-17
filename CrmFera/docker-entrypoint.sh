#!/bin/sh
set -e

echo "[crm] aplicando migracoes em $DATABASE_URL"
mkdir -p /opt/crm/data
npx prisma migrate deploy

# Semeia o usuario so na primeira subida (banco novo)
# (só marca como semeado se deu certo: seed que falha tenta de novo na próxima subida)
if [ ! -f /opt/crm/data/.semeado ]; then
  echo "[crm] primeira subida — rodando seed"
  if npx tsx prisma/seed.ts; then
    touch /opt/crm/data/.semeado
  else
    echo "[crm] SEED FALHOU: confira SEED_EMAIL/SEED_SENHA no .env e o negocio.json. Tenta de novo na próxima subida."
  fi
fi

echo "[crm] subindo na porta ${PORT:-3900}"
exec "$@"
