#!/bin/sh
set -eu

if [ -n "${KAFKA_DISCOVERY_HOST:-}" ]; then
  export KAFKA_BOOTSTRAP_SERVERS="${KAFKA_DISCOVERY_HOST}:9092"
fi

exec java -jar app.jar
