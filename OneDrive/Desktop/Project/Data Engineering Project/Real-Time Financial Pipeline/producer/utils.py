import os
import json
import time
from kafka import KafkaProducer
import requests

FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "YOUR_API_KEY")
KAFKA_BROKER = "localhost:9092"
TOPIC = "stock_prices"
SYMBOLS = ["AAPL", "MSFT", "GOOGL"]

producer = KafkaProducer(
    bootstrap_servers=[KAFKA_BROKER],
    value_serializer=lambda v: json.dumps(v).encode("utf-8")
)

def get_stock_price(symbol):
    url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={FINNHUB_API_KEY}"
    resp = requests.get(url)
    return resp.json()

if __name__ == "__main__":
    while True:
        for symbol in SYMBOLS:
            price_data = get_stock_price(symbol)
            producer.send(TOPIC, {"symbol": symbol, "price_data": price_data})
            print(f"Sent: {symbol} -> {price_data}")
        time.sleep(5)
