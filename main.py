import asyncio
import socket
import time
import logging
import struct
from dataclasses import dataclass


port = 8888
@dataclass
class sensorPacket:
    id: int
    Ts: int
    read_flags: bytes
    dataPoints: list[list[float]]





data_queue: asyncio.Queue[bytes] = asyncio.Queue()
update_queue = asyncio.Queue()

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
        # Do some processing (can be CPU-bound or async)

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

        data_queue.task_done()



def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    finally:
        s.close()
        return ip

async def main():
    server = await asyncio.start_server(handle_client, get_local_ip(),port)
    addrs = ', '.join(str(sock.getsockname()) for sock in server.sockets)
    print(f'Serving on {addrs}')
    async with server:
        await asyncio.gather(server.serve_forever(), process_queue())

asyncio.run(main())
