#!/bin/sh
set -eu

# Render supplies postgresql://..., while the PostgreSQL JDBC driver expects
# jdbc:postgresql://.... Local Docker Compose continues to provide DB_URL.
if [ -n "${DATABASE_URL:-}" ] && [ -z "${DB_URL:-}" ]; then
  export DB_URL="jdbc:${DATABASE_URL}"
fi

exec java --add-opens=java.base/java.nio=ALL-UNNAMED -jar app.jar
