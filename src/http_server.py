from aiohttp import web, WSMsgType
from pathlib import Path
from tcp_server import update_queue

WEB_DIR = Path("data")  


websocket_clients = set()

async def websocket_handler(request: web.Request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    websocket_clients.add(ws)
    print(f"ws client connected")

    try:
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                print(f" WS message: {msg.data}")
                if msg.data == "ping":
                    await ws.send_str("pong")
            elif msg.type == WSMsgType.ERROR:
                print(f"WS error: {ws.exception()}")
    finally:
        websocket_clients.remove(ws)
        print(f"WebSocket client disconnected")

    return ws


async def index_handler(request: web.Request):
    return web.FileResponse(WEB_DIR / "webpage.html")

def create_web_app():
    app = web.Application()
    app.router.add_get("/", index_handler)
    app.router.add_static("/", path=str(WEB_DIR), show_index=True)
    app.router.add_get("/ws", websocket_handler)
    return app

async def start_http_server(host: str, port: int):
    """Starts the HTTP server."""
    app = create_web_app()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, host, port)
    await site.start()
    print(f"HTTP server running on http://{host}:{port}")


async def broadcast(message: str):
    for ws in list(websocket_clients):
        if not ws.closed:
            await ws.send_str(message)

async def consume_updates():
    while True:
        packet = await update_queue.get()

        for i in range(3):
            if packet.read_flags[0] >> i & 1:
                msg = {
                    "type": "sensor_update",
                    "id": packet.id,
                    "read_type": i,
                    "Ts": packet.Ts,
                    "dataPoints": packet.dataPoints.pop(0) if packet.dataPoints else [0.0] * 10,
                }
                await broadcast(str(msg)) 


