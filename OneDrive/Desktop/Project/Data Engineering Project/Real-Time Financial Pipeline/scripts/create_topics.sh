#!/bin/bash
# Adjust path to your kafka/bin if needed
KAFKA_BIN=${KAFKA_BIN:-/usr/bin}
BOOTSTRAP=${BOOTSTRAP:-localhost:9092}

# Create main topics
docker exec -it $(docker ps --filter "ancestor=confluentinc/cp-kafka" -q | head -n1) \
  kafka-topics --create --topic trades --partitions 6 --replication-factor 1 --bootstrap-server kafka:29092 || true

docker exec -it $(docker ps --filter "ancestor=confluentinc/cp-kafka" -q | head -n1) \
  kafka-topics --create --topic vwap_1m --partitions 6 --replication-factor 1 --bootstrap-server kafka:29092 || true

echo "Topics created (if not existed)"