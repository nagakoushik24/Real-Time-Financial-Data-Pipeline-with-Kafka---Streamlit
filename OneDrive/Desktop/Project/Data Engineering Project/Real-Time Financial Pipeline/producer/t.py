import asyncio
import websockets

async def test_ws():
    uri = "wss://ws.ifelse.io"
    async with websockets.connect(uri) as websocket:
        await websocket.send("Hello WebSocket!")
        print("Sent: Hello WebSocket!")
        response = await websocket.recv()
        print("Received:", response)

asyncio.run(test_ws())
