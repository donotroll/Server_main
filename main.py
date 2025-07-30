import asyncio
import time
import logging
from dataclasses import dataclass


ip = '127.0.0.1' 
port = 8888


async def handle_client(streamReader, streamWriter):
    TCP_data = await streamReader.read()
    print(TCP_data)






async def main():
    server = await asyncio.start_server(handle_client, ip, port)
    addrs = ', '.join(str(sock.getsockname()) for sock in server.sockets)
    print(f'Serving on {addrs}')

    async with server:
        await server.serve_forever()

asyncio.run(main())
