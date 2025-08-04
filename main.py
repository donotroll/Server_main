import asyncio
import socket
from pathlib import Path
from aiohttp import web
import struct
from dataclasses import dataclass



def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    finally:
        s.close()
        return ip

host_ip = get_local_ip()
port = 8888
http_port = 8080


@dataclass
class sensorPacket:
    id: int
    Ts: int
    read_flags: bytes
    dataPoints: list[list[float]]


data_queue: asyncio.Queue[bytes] = asyncio.Queue()
update_queue = asyncio.Queue()
WEB_DIR = Path("WebPage")

async def handle_client(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):

    try:
        chunk = await reader.read()  # read til EOF
        await data_queue.put(chunk) 
    except asyncio.CancelledError:
        print("client disconnected?")
        pass
    finally:
        #todo write updates
        writer.close()
        await writer.wait_closed()

async def process_queue():

    while True:
        data = await data_queue.get()
        try:
            parts = data.split(b"\r\n\n")
            if len(parts) < 4: 
                continue
            
            print(f"[QUEUE] Received {len(data)} bytes,  {parts}")

            id = int.from_bytes(parts[0], "little")
            read_flag = parts[1]
            Ts = struct.unpack('<i', parts[2])[0]
            dataPoints = []

            for raw_data_bytes in parts[3:]:
                size = len(raw_data_bytes) // 4
                print(f"packet size: {size}")
                raw_data = struct.unpack(f'<{size}f', raw_data_bytes)
                dataPoints.append(raw_data)

            packet = sensorPacket(id, read_flag, Ts, dataPoints)
            print(packet)
            await update_queue.put(packet)
        except :
            print("error with deserialisation")
            pass

async def index_handler(request: web.Request):
    return web.FileResponse(WEB_DIR / "index.html")

def create_web_app():
    app = web.Application()

    # Serve / → index.html
    app.router.add_get("/", index_handler)

    # Serve static files from WebPage directory
    app.router.add_static("/", path=str(WEB_DIR), show_index=True)

    return app



    

async def main():
    server = await asyncio.start_server(handle_client, get_local_ip(),port)
    addrs = ', '.join(str(sock.getsockname()) for sock in server.sockets)
    print(f'ESP32 TCP server running on {addrs}:{port}')


    app = create_web_app()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner,host_ip,http_port)
    await site.start()
    print(f"HTTP server running on http://{host_ip}:{http_port}")

    async with server:
        await asyncio.gather(server.serve_forever(), process_queue())

asyncio.run(main())
