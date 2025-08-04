import asyncio
import socket

from tcp_server import start_tcp_server
from http_server import start_http_server

TCP_PORT = 8888
HTTP_PORT = 8080

def get_local_ip():
    """Find the local IP address for hosting servers."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    finally:
        s.close()
    return ip

async def main():
    host_ip = get_local_ip()

    await asyncio.gather(
        start_tcp_server(host_ip, TCP_PORT),
        start_http_server(host_ip, HTTP_PORT)
    )

if __name__ == "__main__":
    asyncio.run(main())
