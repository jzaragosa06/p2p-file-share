"""
This code basically demonstrates a file sharing 
using a client-server architecture. It's not P2P.
"""

# import necessary modules

# for implementing the HTTP Web servers
import http.server

# provides access to the BSD socket interface
import socket

# a framework for network servers
import socketserver

# to display a Web-based documents to users
import webbrowser

# to access operating system control
import os


# assigning the appropriate port value
PORT = 8010

# changing the directory to access the files on the desktop
# desktop = os.path.join(os.path.join(os.environ["USERPROFILE"]), "sample-directory")
desktop = os.path.join(os.environ["USERPROFILE"], "sample-directory")

os.chdir(desktop)

# creating an HTTP request handler
Handler = http.server.SimpleHTTPRequestHandler
# getting the IP address of the computer
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
s.connect(("8.8.8.8", 80))
IP = "http://" + s.getsockname()[0] + ":" + str(PORT)
link = IP

# creating the HTTP request and serving the folder at PORT 8010
# continuous stream of data between client and server
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("Serving at port", PORT)
    print("Type this in your Browser:", IP)
    httpd.serve_forever()

# opens the IP link in the web browser
# the webbrowser package only allow us to open the default browser.
# It doesn't provide the web interface
# webbrowser.open(link)


# # ===================================================================
# # improved version for faster download on the end device.
# import http.server
# import socket
# import socketserver
# import webbrowser
# import os
# from socketserver import ThreadingMixIn


# # Specify the port
# PORT = 8010

# # Change directory to access the files in "sample-directory"
# directory = os.path.join(os.environ["USERPROFILE"], "sample-directory")
# os.chdir(directory)


# # Create a threaded HTTP request handler
# class ThreadedHTTPServer(ThreadingMixIn, socketserver.TCPServer):
#     pass


# Handler = http.server.SimpleHTTPRequestHandler

# # Get the IP address of the computer
# s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
# s.connect(("8.8.8.8", 80))
# IP = "http://" + s.getsockname()[0] + ":" + str(PORT)
# link = IP

# # Open the IP link in the web browser
# webbrowser.open(link)

# # Serve files with a threaded server at PORT 8010
# with ThreadedHTTPServer(("", PORT), Handler) as httpd:
#     print("Serving files from:", directory)
#     print("Serving at port", PORT)
#     print("Type this in your Browser:", IP)
#     httpd.serve_forever()
