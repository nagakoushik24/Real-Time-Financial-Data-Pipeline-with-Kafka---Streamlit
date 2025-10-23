# kafka_consumer.py
import json
import time
import threading
from collections import deque
from confluent_kafka import Consumer, KafkaError
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("kafka_consumer")

_buffer = deque()
_buffer_lock = threading.Lock()
_buffer_maxlen = 100000
_consumer_started = False

def _parse_finnhub_message(raw_json):
    rows = []
    try:
        payload = json.loads(raw_json)
    except Exception:
        return rows
    if payload.get("type") != "trade":
        return rows
    for tick in payload.get("data", []):
        rows.append({
            "symbol": tick.get("s"),
            "price": float(tick.get("p", 0)),
            "volume": int(tick.get("v", 0)),
            "ts": int(tick.get("t") or int(time.time() * 1000))
        })
    return rows

def start_consumer(bootstrap_servers="localhost:9092", topic="finnhub", group_id="streamlit-ui-group", offset_reset="earliest"):
    """
    Start a background Kafka consumer thread that appends parsed records into an internal buffer.
    Use offset_reset='earliest' to read existing messages if no committed offsets exist.
    """
    global _consumer_started
    if _consumer_started:
        logger.debug("Consumer already started")
        return

    def run():
        conf = {
            "bootstrap.servers": bootstrap_servers,
            "group.id": group_id,
            "auto.offset.reset": offset_reset,
            "enable.auto.commit": True
        }
        consumer = Consumer(conf)
        consumer.subscribe([topic])
        logger.info("Kafka consumer started (bootstrap=%s topic=%s)", bootstrap_servers, topic)
        try:
            while True:
                msg = consumer.poll(timeout=1.0)
                if msg is None:
                    continue
                if msg.error():
                    # non-fatal EOF
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    logger.error("Consumer error: %s", msg.error())
                    continue
                try:
                    raw = msg.value().decode("utf-8")
                except Exception:
                    logger.exception("Failed to decode msg.value()")
                    continue
                rows = _parse_finnhub_message(raw)
                if rows:
                    with _buffer_lock:
                        for r in rows:
                            if len(_buffer) >= _buffer_maxlen:
                                _buffer.popleft()
                            _buffer.append(r)
        except Exception:
            logger.exception("Consumer thread exception")
        finally:
            consumer.close()
            logger.info("Consumer closed")

    t = threading.Thread(target=run, daemon=True, name="kafka-consumer-thread")
    t.start()
    _consumer_started = True

def get_batch(max_items=500):
    """Pop up to max_items items from the buffer (thread-safe) and return them as list."""
    items = []
    with _buffer_lock:
        while _buffer and len(items) < max_items:
            items.append(_buffer.popleft())
    return items
