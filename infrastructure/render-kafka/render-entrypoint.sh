#!/bin/bash
set -euo pipefail

KAFKA_HOST="${RENDER_DISCOVERY_SERVICE:-localhost}"
export KAFKA_ADVERTISED_LISTENERS="PLAINTEXT://${KAFKA_HOST}:9092"
export KAFKA_CONTROLLER_QUORUM_VOTERS="1@${KAFKA_HOST}:9093"

exec /etc/kafka/docker/run
