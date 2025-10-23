-- create stream from JSON topic
CREATE STREAM trades_raw (
  s VARCHAR,
  p DOUBLE,
  v BIGINT,
  t BIGINT,
  ingest_ts BIGINT
) WITH (KAFKA_TOPIC='trades', VALUE_FORMAT='JSON', TIMESTAMP='t');

-- 1-min VWAP table
CREATE TABLE vwap_1m AS
  SELECT s AS symbol,
         WINDOWSTART AS window_start,
         SUM(p * v) / SUM(v) AS vwap
  FROM trades_raw
  WINDOW TUMBLING (SIZE 1 MINUTE)
  GROUP BY s;

-- 1-min OHLC (uses first/last workaround)
CREATE TABLE ohlc_1m AS
  SELECT symbol, window_start, MIN(price) AS low, MAX(price) AS high,
         COLLECT_LIST(price) AS prices
  FROM (
    SELECT s AS symbol, p AS price, WINDOWSTART AS window_start
    FROM trades_raw WINDOW TUMBLING (SIZE 1 MINUTE)
  )
  GROUP BY symbol, window_start;

-- alerts: example when price changes > 2% within 1 minute
CREATE TABLE price_alerts AS
  SELECT s AS symbol, LATEST_BY_OFFSET(p) AS last_price,
         LAG(LATEST_BY_OFFSET(p)) OVER (PARTITION BY s ORDER BY ROWTIME) AS prev_price
  FROM trades_raw
  GROUP BY s
  HAVING prev_price IS NOT NULL AND (ABS(last_price - prev_price) / prev_price) > 0.02;