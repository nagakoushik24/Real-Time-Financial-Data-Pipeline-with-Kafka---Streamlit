# producer_finnhub.py
from dotenv import load_dotenv
load_dotenv()

import os
import json
import time
import websocket
import logging
from confluent_kafka import Producer

# CONFIG
FINNHUB_KEY = "d2d0etpr01qjem5if830d2d0etpr01qjem5if83g"
if not FINNHUB_KEY:
    raise RuntimeError("Set FINNHUB_KEY in environment or .env")

SYMBOLS = [s.strip() for s in os.getenv("SYMBOLS", "AAPL,MSFT,GOOGL").split(",")]
KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "finnhub")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("producer")

producer = Producer({"bootstrap.servers": KAFKA_BROKER})

def delivery_report(err, msg):
    if err is not None:
        logger.error("Delivery failed: %s", err)
    else:
        logger.debug("Delivered to %s [%d] @ %s", msg.topic(), msg.partition(), msg.offset())

def on_open(ws):
    logger.info("WebSocket opened; subscribing to symbols: %s", SYMBOLS)
    for symbol in SYMBOLS:
        if not symbol:
            continue
        ws.send(json.dumps({"type": "subscribe", "symbol": symbol}))
        logger.info("Subscribed to %s", symbol)

def on_message(ws, message):
    # Produce raw Finnhub JSON message to Kafka
    try:
        producer.produce(KAFKA_TOPIC, value=message.encode("utf-8"), callback=delivery_report)
        producer.poll(0)
    except BufferError:
        logger.warning("Local producer queue full — flushing")
        producer.flush()
    except Exception:
        logger.exception("Failed to produce message")

def on_error(ws, error):
    logger.error("WebSocket error: %s", error)

def on_close(ws, code, reason):
    logger.warning("WebSocket closed: %s %s", code, reason)

if __name__ == "__main__":
    url = f"wss://ws.finnhub.io?token={FINNHUB_KEY}"
    logger.info("Connecting to Finnhub at %s", url)
    while True:
        try:
            ws = websocket.WebSocketApp(url,
                                        on_open=on_open,
                                        on_message=on_message,
                                        on_error=on_error,
                                        on_close=on_close)
            ws.run_forever(ping_interval=20, ping_timeout=10)
        except KeyboardInterrupt:
            logger.info("Interrupted by user, flushing producer and exiting")
            producer.flush()
            break
        except Exception:
            logger.exception("WebSocket loop exception, reconnecting in 5s")
            time.sleep(5)
