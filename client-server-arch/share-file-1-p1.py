"""
This creates a web server, which uses a client-server architecture.
    -Server
    -Client can access the server via a HTTP GET request to retrieve files.

It serves the resource in the current directory.

The socketserver (socketserver.TCPServer) handle the routes and interface/pages.
It is a framework, which includes both the routing and the interfaces/pages.
It uses the TCP (Transmission Control Protocol) for reliable, connection-oriented
communication between server and clients.

Practically, this is a  
    -Application Layer: it is a http server
    -Transport layer: it uses TCP,
    -Socket
"""

import http.server
import socketserver
import os
import socket

PORT = 8010
# change the directory to where the files we want to server are stored.
resourceDir = os.path.join(os.environ["USERPROFILE"], "sample-directory")
os.chdir(resourceDir)

# link to access the server
# IP = "http://" + "192.168.1.9" + ":" + str(PORT)

"""
to dynamically get the ip address of the computer we can
connect to a server by opening a socket/stablishing a connection via a socket
and obtain our own ip address
"""
with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
    sock.connect(("8.8.8.8", 80))
    ipv4_address = sock.getsockname()[0]
    IP = "http://" + ipv4_address + ":" + str(PORT)
link = IP

# create the web server
handler = http.server.SimpleHTTPRequestHandler
# server = socketserver.TCPServer(("", PORT), handler)
# print("Serving at port", PORT)
# print("Type this in your Browser:", IP)
# server.serve_forever()
with socketserver.TCPServer(("", PORT), handler) as httpd:
    print("Serving at port", PORT)
    print("Type this in your Browser:", IP)
    httpd.serve_forever()
