#!/bin/sh
set -eu

sq() {
  printf '%s' "$1" | sed "s/'/'\\\\''/g"
}

if [ -z "${DATABASE_URL:-}" ]; then
  echo "scheduler: DATABASE_URL não está definida." >&2
  exit 1
fi

tz="${TZ:-America/Bahia}"
zoneinfo="/usr/share/zoneinfo/${tz}"
if [ ! -f "${zoneinfo}" ]; then
  echo "scheduler: fuso horário inexistente: ${tz}" >&2
  exit 1
fi

ln -snf "${zoneinfo}" /etc/localtime
printf '%s\n' "${tz}" > /etc/timezone

umask 077
{
  printf "export TZ='%s'\n" "$(sq "${tz}")"
  printf "export DATABASE_URL='%s'\n" "$(sq "${DATABASE_URL}")"
  printf "export PYTHONPATH='%s'\n" "$(sq "${PYTHONPATH:-/app}")"
  printf "export PYTHONUNBUFFERED='%s'\n" "$(sq "${PYTHONUNBUFFERED:-1}")"
} > /etc/scheduler.env

echo "scheduler: aguardando agendamentos em ${tz}. Nenhuma coleta é executada na inicialização."
exec /usr/sbin/cron -f
