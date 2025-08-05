import asyncio
import struct
from http_server import broadcast
from dataclasses import dataclass

@dataclass
class SensorPacket:
    id: int
    Ts: int
    read_flags: bytes
    dataPoints: list[list[float]]

data_queue: asyncio.Queue[bytes] = asyncio.Queue()
update_queue: asyncio.Queue[SensorPacket] = asyncio.Queue()


async def handle_client(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    """Handles incoming TCP data from ESP32 clients."""
    try:
        chunk = await reader.read()  # Read until EOF
        await data_queue.put(chunk)
    except asyncio.CancelledError:
        print("Client disconnected.")
    finally:
        writer.close()
        await writer.wait_closed()


async def process_queue():
    while True:
        data = await data_queue.get()
        try:
            parts = data.split(b"\r\n\n")
            if len(parts) < 4:
                continue

            #print(f"[QUEUE] Received {len(data)} bytes, {parts}")

            id = int.from_bytes(parts[0], "little")
            read_flag = parts[1]
            Ts = struct.unpack('<i', parts[2])[0]

            dataPoints = []
            for raw_data_bytes in parts[3:]:
                size = len(raw_data_bytes) // 4
                raw_data = struct.unpack(f'<{size}f', raw_data_bytes)
                dataPoints.append(raw_data)

            packet = SensorPacket(id, Ts, read_flag, dataPoints)
            print(packet)
            await update_queue.put(packet)

        except Exception as e:
            print(f"Error with deserialization: {e}")

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
                print(msg)
                await broadcast(str(msg)) 

async def start_tcp_server(host: str, port: int):
    server = await asyncio.start_server(handle_client, host, port)
    addrs = ', '.join(str(sock.getsockname()) for sock in server.sockets)
    print(f"ESP32 TCP server running on {addrs}")

    async with server:
        await asyncio.gather(server.serve_forever(), process_queue(), consume_updates())



