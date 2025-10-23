# frontend/streamlit_app.py
from dotenv import load_dotenv
load_dotenv()

import streamlit as st
import pandas as pd
import time
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
from fpdf import FPDF
import kafka_consumer as kc
import os

st.set_page_config(page_title="Real-time Fin Dashboard", layout="wide")

# Config
KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "finnhub")

# Session defaults
st.session_state.setdefault("streaming", True)
st.session_state.setdefault("records", [])
st.session_state.setdefault("max_records", 2000)
st.session_state.setdefault("refresh", 2)  # seconds
st.session_state.setdefault("bootstrap_servers", KAFKA_BROKER)
st.session_state.setdefault("topic", KAFKA_TOPIC)

# Start consumer background thread (writes into internal buffer)
kc.start_consumer(bootstrap_servers=st.session_state["bootstrap_servers"],
                  topic=st.session_state["topic"],
                  offset_reset="earliest")  # 'earliest' helpful for testing

# Sidebar UI
with st.sidebar:
    st.title("Controls")
    st.session_state["refresh"] = st.slider("Refresh interval (s)", 1, 5, st.session_state["refresh"])
    st.session_state["max_records"] = st.number_input("Keep last N records in UI", min_value=100, max_value=50000, value=st.session_state["max_records"], step=100)
    symbol_filter = st.multiselect("Symbols (empty = all)", options=sorted({r.get("symbol") for r in st.session_state["records"] if r.get("symbol")}), default=[])
    alert_pct = st.number_input("Alert threshold (%)", 0.1, 100.0, 2.0, 0.1)
    if st.button("Pause/Resume"):
        st.session_state["streaming"] = not st.session_state["streaming"]
    st.markdown("---")
    bs = st.text_input("bootstrap_servers", value=st.session_state["bootstrap_servers"])
    if st.button("Apply Kafka settings"):
        st.session_state["bootstrap_servers"] = bs
        st.experimental_rerun()

# Helpers
def to_dataframe(records):
    if not records:
        return pd.DataFrame(columns=["symbol", "price", "volume", "ts", "dt"])
    df = pd.DataFrame(records)
    if "s" in df.columns and "symbol" not in df.columns:
        df.rename(columns={"s": "symbol"}, inplace=True)
    df = df.dropna(subset=["symbol", "price", "ts"])
    df["dt"] = pd.to_datetime(df["ts"], unit="ms")
    df["price"] = df["price"].astype(float)
    df["volume"] = df["volume"].astype(int)
    return df

def pull_from_buffer(max_take=500):
    if not st.session_state["streaming"]:
        return 0
    items = kc.get_batch(max_items=max_take)
    if not items:
        return 0
    recs = st.session_state["records"]
    recs.extend(items)
    # cap records
    if len(recs) > st.session_state["max_records"]:
        st.session_state["records"] = recs[-st.session_state["max_records"]:]
    return len(items)

# Pull once
pulled = pull_from_buffer(500)

# Main layout
st.title("Real-Time Financial Dashboard")
col1, col2 = st.columns([2, 1])

with col1:
    st.subheader("Live Trades (latest first)")
    # pull on each run
    pulled = pull_from_buffer(300)
    df = to_dataframe(st.session_state["records"])
    if symbol_filter:
        df = df[df["symbol"].isin(symbol_filter)]
    st.dataframe(df.tail(500).sort_values("dt", ascending=False), use_container_width=True)

    st.subheader("Price chart")
    symbols = sorted(df["symbol"].unique()) if not df.empty else []
    sel_symbol = st.selectbox("Select symbol", options=symbols or ["AAPL"])
    if sel_symbol and not df.empty:
        df_sym = df[df["symbol"] == sel_symbol].sort_values("dt")
        if not df_sym.empty:
            fig = px.line(df_sym, x="dt", y="price", title=f"{sel_symbol} price")
            st.plotly_chart(fig, use_container_width=True)

    st.subheader("1-minute OHLC (candles)")
    if not df.empty and sel_symbol in df["symbol"].unique():
        g = df[df["symbol"] == sel_symbol].set_index("dt")
        o = g["price"].resample("1min").first()
        h = g["price"].resample("1min").max()
        l = g["price"].resample("1min").min()
        c = g["price"].resample("1min").last()
        ohlc = pd.concat([o,h,l,c], axis=1).dropna()
        ohlc.columns = ["open","high","low","close"]
        ohlc = ohlc.reset_index()
        if not ohlc.empty:
            fig2 = go.Figure(data=[go.Candlestick(x=ohlc["dt"], open=ohlc["open"], high=ohlc["high"], low=ohlc["low"], close=ohlc["close"])])
            st.plotly_chart(fig2, use_container_width=True)

    st.subheader("Alerts")
    alerts = []
    if not df.empty:
        last = df.sort_values("dt").groupby("symbol").last().reset_index()
        prev = df.sort_values("dt").groupby("symbol").nth(-2).reset_index()
        if not prev.empty:
            merged = last.merge(prev, on="symbol", suffixes=("_last","_prev"))
            merged["pct_change"] = (merged["price_last"] - merged["price_prev"]) / merged["price_prev"] * 100
            for _, row in merged.iterrows():
                if abs(row["pct_change"]) >= alert_pct:
                    alerts.append(f"{row['symbol']}: {row['price_last']} ({row['pct_change']:.2f}%)")
    if alerts:
        for a in alerts:
            st.error(a)
    else:
        st.info("No alerts")

with col2:
    st.subheader("Stats")
    if not df.empty:
        st.metric("Total ticks", len(df))
        st.metric("Unique symbols", df["symbol"].nunique())
        latest_ts = df["dt"].max()
        st.metric("Latest timestamp", latest_ts.strftime("%Y-%m-%d %H:%M:%S") if pd.notnull(latest_ts) else "N/A")

    st.markdown("---")
    st.subheader("Export")
    if not df.empty:
        csv = df.to_csv(index=False).encode("utf-8")
        st.download_button("Download CSV", csv, file_name="trades.csv", mime="text/csv")
        st.download_button("Download JSON", df.to_json(orient="records", date_format="iso"), file_name="trades.json", mime="application/json")

# Auto-refresh
time.sleep(st.session_state["refresh"])
# Use rerun (compat)
if hasattr(st, "rerun"):
    st.rerun()
else:
    st.experimental_rerun()
