#!/bin/sh
set -eu

# Render supplies postgresql://user:password@host/database, while the JDBC
# driver expects credentials separately and a jdbc:postgresql:// URL.
# Local Docker Compose continues to provide DB_URL directly.
if [ -n "${DATABASE_URL:-}" ] && [ -z "${DB_URL:-}" ]; then
  render_db="${DATABASE_URL#postgresql://}"
  render_host_path="${render_db#*@}"
  render_host="${render_host_path%%/*}"
  render_database="${render_host_path#*/}"

  case "$render_host" in
    *:*) ;;
    *) render_host="${render_host}:5432" ;;
  esac

  export DB_URL="jdbc:postgresql://${render_host}/${render_database}"
fi

if [ -n "${KAFKA_DISCOVERY_HOST:-}" ]; then
  export KAFKA_BOOTSTRAP_SERVERS="${KAFKA_DISCOVERY_HOST}:9092"
fi

if [ -n "${IGNITE_DISCOVERY_HOST:-}" ]; then
  export IGNITE_ADDRESSES="${IGNITE_DISCOVERY_HOST}:10800"
fi

exec java --add-opens=java.base/java.nio=ALL-UNNAMED -jar app.jar
